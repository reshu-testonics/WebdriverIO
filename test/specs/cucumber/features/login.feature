Feature: To test the login functionality in "The Internet Herokuapp

Background:
Given the user is on login page

Scenario: The one where user logs in using valid credentials
    When the user enters username as "tomsmith" and password as "SuperSecretPassword!"
    And clicks on login button
    Then the user must navigate to secure area page displaying a message "You logged into a secure area!"

Scenario Outline: The one where user logs in using invalid credentials
    When the user enters username as "<username>" and password as "<password>"
    And clicks on login button
    Then the user must remain on login page displaying a message "<errorMessage>"
Examples:
    | username  | password              | errorMessage       |
    | james     | SuperSecretPassword!  | Invalid username!  |
    | tomsmith  | SuperPassword!        | Invalid password!  |