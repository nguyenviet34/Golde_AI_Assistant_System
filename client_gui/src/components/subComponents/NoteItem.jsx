import { Card, Flex, Metric } from "@tremor/react"
import { useNavigate } from "react-router-dom"
import EllipsisMenu from "../EllipsisMenu";

const NoteText = () => {
    return (
        <Metric>
            <p className="text-sm text-gray-500 line-clamp-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. 
                Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. 
                Praesent mauris. Fusce nec tellus sed augue semper porta. 
                Mauris massa. Vestibulum lacinia arcu eget nulla. 
                Class aptent taciti sociosqu ad litora torquent per conubia nostra, 
                per inceptos himenaeos. Curabitur sodales ligula in libero.
            </p>
        </Metric> 
    )
}

const NoteItem = (props) => {
    // const navigate = useNavigate();

    return (
        <Card className="w-xs h-72 hover:cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105 duration-300"
            decoration="left" decorationColor="indigo">
            <Flex justifyContent="between" alignItems="center">
                <Metric>{props.name}</Metric>
                <EllipsisMenu elementName="Note" elementId={props.elementId} />
            </Flex>

            <Flex className="mt-4">
                <Metric> {props.description} </Metric>
                {/* <Button variant="primary" className="p-2" color="indigo"
                    type="button" onClick={() => navigate(props.url)}
                > {props.buttonText}
                </Button> */}
                <NoteText />
            </Flex>
        </Card>
    )
}

export default NoteItem;