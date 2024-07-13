package wo.work_optimization.core.service.rest.impl.mono_services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;
import wo.work_optimization.core.domain.dto.request.TaskRegistrationRequestDTO;
import wo.work_optimization.core.domain.dto.response.base.GeneralResponse;
import wo.work_optimization.core.service.rest.TaskRegistrationService;
import wo.work_optimization.kernel.utils.DataUtils;

@Slf4j
@Service
public class TaskRegistrationServiceImpl implements TaskRegistrationService {
    
    @Autowired
    private DataUtils dataUtils;

    public GeneralResponse<String> registerWorkOptimization(TaskRegistrationRequestDTO request) {
        // validate request
        boolean requestValidation = validateRequest(request);
        log.info(requestValidation ? "Request is valid" : "Request is invalid");
        // validate request.userId
        // store db
        // return response
        return null;
    }
    
    private boolean validateRequest(TaskRegistrationRequestDTO request) {
        if (dataUtils.isNullOrEmpty(request)) {
            return false;
        }
        if (dataUtils.isNullOrEmpty(request.getUserId())) {
            return false;
        }
        if (dataUtils.isNullOrEmpty(request.getWorkTime())) {
            return false;
        }
        if (request.getWorkTime() <= 0) {
            return false;
        }
        if (!checkExistedUser(request.getUserId())) {
            return false;
        }
        return true;
    }

    private boolean checkExistedUser(Long userId) {
        // check existed user
        
        return true;
    }
}
