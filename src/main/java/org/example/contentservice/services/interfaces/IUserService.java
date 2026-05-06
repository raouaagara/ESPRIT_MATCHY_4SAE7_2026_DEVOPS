package org.example.contentservice.services.interfaces;

import org.example.contentservice.entities.User;

import java.util.List;

public interface IUserService {
    List<User> retrieveAllUsers();
    User addUser(User user);
    User updateUser(User user);
    User retrieveUser(Integer id);  // ← Changé userId en id
    void deleteUser(Integer id);     // ← Changé userId en id
}