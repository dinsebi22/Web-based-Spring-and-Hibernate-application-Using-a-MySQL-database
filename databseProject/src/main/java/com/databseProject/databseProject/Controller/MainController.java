package com.databseProject.databseProject.Controller;


import com.databseProject.databseProject.Users.User;
import com.databseProject.databseProject.Users.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;


@Controller
@RequestMapping(path = "/demo")
public class MainController {
    @Autowired
    private UserRepo userRepo;


    public void addNewUser(String f_name , String l_name , String email , String password){
        User newUser = new User();
        newUser.setF_name(f_name);
        newUser.setL_name(l_name);
        newUser.setEmail(email);
        newUser.setPassword(password);
        userRepo.save(newUser);

    }

    @GetMapping(path = "/all")
    public @ResponseBody Iterable<User> getAllUsers(){
        return userRepo.findAll();
    }

    @GetMapping(path = "/get")
    public @ResponseBody String getUser(@RequestParam Integer id){
        try{
            return userRepo.findById(id).get().toString();
        }catch (NoSuchElementException e){
            return "No one with that ID!!!";
        }

    }


    @RequestMapping(path = "/remove")
    public @ResponseBody void removeUser(@RequestParam Integer id ){
        try {
            userRepo.deleteById(id);
        }catch (EmptyResultDataAccessException e){
            System.out.println("No one with that ID!!!");
        }
    }


    @GetMapping("/")
    public String home(Model model){
        model.addAttribute("user", new User());
        return "home";
    }

    @PostMapping("/hello")
    public String greetingSubmit(@ModelAttribute User user) {
        addNewUser(user.getF_name() , user.getL_name() , user.getEmail() , user.getPassword());
        System.out.println(user.toString() +" <============== Added to database");

        return "hello";
    }
    @GetMapping("/users")
    public String allTheUsers(Model listModel) {

//        for(User user : userRepo.findAll()){
//            System.out.println(user);
//        }
        listModel.addAttribute("userList",userRepo.findAll());
        return "users";
    }



}
