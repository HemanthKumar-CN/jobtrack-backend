npx sequelize-cli db:seed:all
npx sequelize-cli db:migrate

create folder exports, uploads in root

tasks left:

5. Notifications
   SMS and Email Notifications:
   Send notifications to employees when schedules are created or updated.
   Include schedule details like date, location, and time in the notification.
   Implement a response mechanism where employees can decline a schedule, triggering an email to the manager.
   SMS Configuration: Provide a way to configure SMS service (e.g., Twilio) through an API endpoint.
6. Roles and Permissions
   Role-based Access: Ensure only managers can create/update schedules, employees can only view their own schedules.
   Implement User Permissions: Create middleware to check if the logged-in user is a manager or employee, and restrict access accordingly.
7. Authentication and Authorization (if not done already)
   User Authentication: Use JWT or sessions for secure authentication of users.
   Access Control: Protect routes based on user roles (admin, manager, employee).
   Password Reset: Complete the implementation of the password reset feature with an email link.
