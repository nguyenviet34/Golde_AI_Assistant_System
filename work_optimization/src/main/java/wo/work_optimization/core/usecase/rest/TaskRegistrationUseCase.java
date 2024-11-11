package wo.work_optimization.core.usecase.rest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import wo.work_optimization.core.domain.dto.request.QueryTaskConfigRequestDTO;
import wo.work_optimization.core.domain.dto.request.TaskRegistrationRequestDTO;
import wo.work_optimization.core.domain.dto.response.TaskResponseDTO;
import wo.work_optimization.core.domain.dto.response.base.GeneralResponse;
import wo.work_optimization.core.domain.enums.ResponseMessage;
import wo.work_optimization.core.service.integration.TaskRegistrationService;
import wo.work_optimization.core.validation.TaskRegistrationValidation;
import wo.work_optimization.kernel.utils.GenericResponse;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskRegistrationUseCase {

    private final TaskRegistrationService taskRegistrationService;
    private final TaskRegistrationValidation taskRegistrationValidation;
    private final GenericResponse<TaskResponseDTO> genericResponse;

    public GeneralResponse<?> registerTaskConfig(TaskRegistrationRequestDTO request) {
        try {
            log.info("Validate request: {}", request);
            Pair<String, Boolean> requestValidation = taskRegistrationValidation.validateRequest(request);
            if (!requestValidation.getSecond()) {
                return genericResponse.matchingResponseMessage(
                        new GenericResponse<>(requestValidation.getFirst(), ResponseMessage.msg400));
            }

            Pair<String, Boolean> isUserExisted = taskRegistrationService.checkExistedUser(request.getUserId());
            if (!isUserExisted.getSecond()) {
                return genericResponse.matchingResponseMessage(
                        new GenericResponse<>(isUserExisted.getFirst(), ResponseMessage.msg400));
            }
            return taskRegistrationService.registerWorkOptimization(request);
        } catch (Exception e) {
            log.error("Error: {}", e.getMessage());
            return genericResponse.matchingResponseMessage(
                    new GenericResponse<>(e.getMessage(), ResponseMessage.msg500));
        }
    }

    public GeneralResponse<?> getTaskConfigInfo(QueryTaskConfigRequestDTO request) {
        try {
            log.info("Validate query request: {}", request);
            Pair<String, Boolean> requestValidation = taskRegistrationValidation.validateQueryRequest(request);
            if (!requestValidation.getSecond()) {
                return genericResponse.matchingResponseMessage(
                        new GenericResponse<>(requestValidation.getFirst(), ResponseMessage.msg400));
            }

            Pair<String, Boolean> isUserExisted = taskRegistrationService.checkExistedUser(request.getUserId());
            if (!isUserExisted.getSecond()) {
                return genericResponse.matchingResponseMessage(
                        new GenericResponse<>(isUserExisted.getFirst(), ResponseMessage.msg400));
            }

            return taskRegistrationService.userRegisterTaskInformation(request);
        } catch (Exception e) {
            log.error("Query Error: {}", e.getMessage());
            return genericResponse.matchingResponseMessage(
                    new GenericResponse<>(e.getMessage(), ResponseMessage.msg500));
        }
    }
}
