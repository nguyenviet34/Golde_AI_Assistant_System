package auth.authentication_service.ui.controllers;

import auth.authentication_service.core.domain.dto.TokenDto;
import auth.authentication_service.core.domain.dto.UserPermissionDto;
import auth.authentication_service.core.domain.dto.request.SignInDtoRequest;
import auth.authentication_service.core.domain.enums.ResponseMessage;
import auth.authentication_service.core.services.interfaces.AuthService;
import auth.authentication_service.kernel.utils.GenericResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    @Autowired
    private GenericResponse<String> genericResponse;

    @GetMapping("/status")
    public ResponseEntity<?> home() {
        return genericResponse.matchingResponseMessage(new GenericResponse<>("Status OK", ResponseMessage.msg200));
    }

    @GetMapping("/user")
    public ResponseEntity<?> user() {
        return ResponseEntity.ok("<h1>Test user role.</h1>");
    }

    @GetMapping("/admin")
    public ResponseEntity<?> admin() {
        return ResponseEntity.ok("<h1>Test admin role.</h1>");
    }

    @RequestMapping(value = "/status", method = RequestMethod.GET)
    public ResponseEntity<?> status() {
        return authService.checkStatus();
    }

    @RequestMapping(value = "/sign-in", method = RequestMethod.POST)
    public ResponseEntity<?> signIn(@RequestBody SignInDtoRequest accountDto) throws Exception {
        return authService.authenticated(accountDto.getUsername(), accountDto.getPassword());
    }

    @RequestMapping(value = "/gaia-auto-sign-in", method = RequestMethod.POST)
    public ResponseEntity<?> gaiaAutoSignIn(@RequestBody SignInDtoRequest accountDto) throws Exception {
        return authService.gaiaAutoSignin(accountDto.getUsername(), accountDto.getPassword());
    }

    @RequestMapping(value = "/check-token", method = RequestMethod.GET)
    public ResponseEntity<?> checkToken(@RequestBody TokenDto token) throws Exception {
        return authService.checkToken(token);
    }

    @RequestMapping(value = "/check-permission", method = RequestMethod.GET)
    public ResponseEntity<?> checkPermission(@RequestBody UserPermissionDto permission) throws Exception {
        return authService.checkPermission(permission);
    }

    // @RequestMapping("/regenerateAccessToken", method = RequestMethod.GET)
    // public ResponseEntity<?> regenerateAccessToken(@RequestBody TokenDto
    // tokenDto) throws Exception {
    // String jwtReponse = tokenService.regenerateToken(tokenDto.getToken(),
    // TokenType.ACCESS_TOKEN);
    // return ResponseEntity.ok(new TokenDto(jwtReponse));
    // }
}
