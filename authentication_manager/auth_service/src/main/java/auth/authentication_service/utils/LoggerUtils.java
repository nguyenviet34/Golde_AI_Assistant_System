package auth.authentication_service.utils;

import auth.authentication_service.enums.LoggerType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggerUtils {

    final Logger logger = LoggerFactory.getLogger(LoggerUtils.class);

    public void log(String message, LoggerType loggerType) {
        if (loggerType == LoggerType.ERROR) { logger.error(message);}
        if (loggerType == LoggerType.INFO) { logger.info(message);}
        if (loggerType == LoggerType.DEBUG) { logger.debug(message);}
        if (loggerType == LoggerType.TRACE) { logger.trace(message);}
        if (loggerType == LoggerType.WARN) { logger.warn(message);}
    }
}
