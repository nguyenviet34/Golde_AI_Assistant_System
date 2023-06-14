import glob
import torch
from datasets import load_dataset, concatenate_datasets
import os
from torch.utils.data import DataLoader
from transformers import DefaultDataCollator


def tokenize_inputs(config, tokenizer, examples):
    max_len = config["max_length"]

    # hacky backward compatible
    different_eos = tokenizer.eos_token != "</s>"
    out = {"labels": [], "input_ids": []}
    for prompt, response in zip(examples["prompt"], examples["response"]):
        if different_eos:
            if response.count("</s> \n") > 0:
                response = response.replace("</s> \n", f"{tokenizer.eos_token} \n")
        
        prompt_len = len(tokenizer(prompt + "\n", return_tensors="pt")["input_ids"][0])

        # hack if our prompt is super long
        # need to include some  some labels so we arbitrarily truncate at maxlength // 2
        # if the length is too long
        if prompt_len >= max_len // 2:
            # truncate to at max 1024 tokens if prompt too long
            new_len = min(max_len // 2, len(prompt) //2)
            prompt = prompt[:new_len]
            # get new prompt length 
            prompt_len = tokenizer(prompt + "\n", return_tensors="pt",
                                    max_length=max_len // 2, 
                                    truncation=True).input_ids.ne(tokenizer.pad_token_id).sum().item()
        
        assert prompt_len <= max_len // 2, f"prompt length {prompt_len} exceeds max length {max_len}"

        input_tokens = tokenizer(prompt + "\n" + response + tokenizer.eos_token,
                                 truncation=True, max_length=max_len, return_tensors="pt")["input_ids"].squeeze()
        
        labels = input_tokens.clone()
        labels[:prompt_len] = -100
        if len(labels) < max_len:
            # pad to max_length witth -100
            labels - torch.cat([labels, torch.full((max_len - len(labels),), -100)])
        
        assert (labels == -100).sum() < len(labels), f"Labels are all -100, something wrong. prompt length {prompt_len} exceeds max length {max_len}"

        if (labels == -100).sum() == len(labels) - 1:
            print(prompt)
            print(response)
            raise
    
        input_tokens = tokenizer.pad({"input_ids": input_tokens}, padding="max_length", max_length=max_len)["inputs_ids"]
        out["labels"].append(labels)
        out["input_ids"].append(input_tokens)

    out = {k: torch.stack(v) if isinstance(v, list) else v for k, v in out.items()}

    return out


def load_data(config, tokenizer):
    dataset_path = config["dataset_path"]

    if os.path.exists(dataset_path):
        if os.path.isdir(dataset_path):
            files = glob.glob(os.path.join(dataset_path, "_*clean.jsonl"))
        else:
            files = [dataset_path]

        print(f"Reading files {files}")

        dataset = load_dataset("json", data_files=files, split="train")

    else:
        dataset = load_dataset(dataset_path, split="train")

    dataset = dataset.train_test_split(test_size=.05, seed=config["seed"])

    train_dataset, val_dataset = dataset["train"], dataset["test"]

    if config["streaming"] is False:
        kwargs = {"num_proc": config["num_proc"]}
    else:
        kwargs = {}

    # tokenizer inputs and return labels and attention mask
    train_dataset = train_dataset.map(
        lambda ele: tokenize_inputs(config, tokenizer, ele),
        batched=True,
        remove_columns=["source", "prompt"],
        **kwargs
    )
    val_dataset = val_dataset.map(
        lambda ele: tokenize_inputs(config, tokenizer, ele),
        batched=True,
        remove_columns=["source", "prompt"],
        **kwargs
    )

    train_dataset = train_dataset.with_format("torch")
    val_dataset = val_dataset.with_format("torch")

    # create dataloader with default data collator since we already have labels
    train_dataloader = DataLoader(
        train_dataset,
        collate_fn=DefaultDataCollator(),
        batch_size=config["batch_size"],
    )
    val_dataloader = DataLoader(
        val_dataset,
        collate_fn=DefaultDataCollator(),
        batch_size=config["batch_size"]
    )

    return train_dataloader, val_dataloader


def load_data_for_inference(config, tokenizer):
    dataset_path = config["dataset_path"]

    if os.path.exists(dataset_path):
        # check if path is a directory
        if os.path.isdir(dataset_path):
            files = glob.glob(os.path.join(dataset_path, "*_clean.jsonl"))
        else:
            files = [dataset_path]

        print(f"Reading files {files}")

        dataset = load_dataset("json", data_files=files, split="train")

    else:
        dataset = load_dataset(dataset_path, split="train")

    dataset = dataset.train_test_split(test_size=.05, seed=config["seed"])

    train_dataset, val_dataset = dataset["train"], dataset["test"]

    train_dataset = train_dataset.add_column("index", list(range(len(train_dataset))))
    # select first N batches that are divisible by batch_size
    # gather is a bit annoying (or the way I'm using it) to get uneven batches as it duplicates data
    train_dataset = train_dataset.select(range((len(train_dataset) // config["batch_size"]) * config["batch_size"]))
    val_dataset = val_dataset.add_column("index", list(range(len(val_dataset))))
    val_dataset = val_dataset.select(range((len(val_dataset) // config["batch_size"]) * config["batch_size"]))

    if config["streaming"] is False:
        kwargs = {"num_proc": config["num_proc"]}
    else:
        kwargs = {}

    # tokenize inputs and return labels and attention mask
    train_dataset = train_dataset.map(
        lambda ele: tokenize_inputs(config, tokenizer, ele),
        batched=True,
        **kwargs
    )
    val_dataset = val_dataset.map(
        lambda ele: tokenize_inputs(config, tokenizer, ele), 
        batched=True,
        **kwargs
    )
    train_dataset = train_dataset.with_format("torch")
    val_dataset = val_dataset.with_format("torch")

    return train_dataset, val_dataset