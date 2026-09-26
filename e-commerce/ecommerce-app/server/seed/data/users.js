// Demo accounts. Passwords are hashed by the User model's pre-save hook.
//   Admin    -> admin@example.com / Admin@123
//   Customer -> user@example.com  / User@123
// The other customers exist so the admin dashboard has realistic data
// (they can log in with the password Customer@123).
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);

const users = [
  {
    name: 'ShopSphere Admin',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    createdAt: daysAgo(90),
  },
  {
    name: 'Alex Johnson',
    email: 'user@example.com',
    password: 'User@123',
    role: 'user',
    createdAt: daysAgo(45),
  },
  {
    name: 'Maria Garcia',
    email: 'maria@example.com',
    password: 'Customer@123',
    role: 'user',
    createdAt: daysAgo(30),
  },
  {
    name: 'David Chen',
    email: 'david@example.com',
    password: 'Customer@123',
    role: 'user',
    createdAt: daysAgo(21),
  },
  {
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    password: 'Customer@123',
    role: 'user',
    createdAt: daysAgo(9),
  },
];

export default users;
