package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.DuplicateResourceException;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public boolean userExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public List<User> findCaptains() {
        return userRepository.findByRole(User.Role.ROLE_CAPTAIN);
    }

    public List<User> findActiveCaptains() {
        return userRepository.findByRoleAndEnabledTrue(User.Role.ROLE_CAPTAIN);
    }

    @Transactional
    public User createUser(String username, String rawPassword, String fullName,
                           String email, String phone, User.Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username already taken: " + username);
        }
        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .role(role)
                .enabled(true)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public void resetPassword(Long userId, String newRawPassword) {
        User user = findById(userId);
        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    @Transactional
    public void setEnabled(Long userId, boolean enabled) {
        User user = findById(userId);
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findById(userId);
        userRepository.delete(user);
    }

    @Transactional
    public User updateUser(Long userId, String fullName, String email, String phone) {
        User user = findById(userId);
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        if (email != null) {
            user.setEmail(email.isBlank() ? null : email.trim());
        }
        if (phone != null) {
            user.setPhone(phone.isBlank() ? null : phone.trim());
        }
        return userRepository.save(user);
    }
}
