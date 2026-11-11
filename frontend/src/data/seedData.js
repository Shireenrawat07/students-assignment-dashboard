export const demoUsers = [
  { id: 'admin-sharma', name: 'Dr. Sharma', email: 'sharma@college.com', password: 'Sharma@123', role: 'admin' },
  { id: 'admin-mehta', name: 'Prof. Mehta', email: 'mehta@college.com', password: 'Mehta@123', role: 'admin' },
  { id: 'student-aarav', name: 'Aarav', email: 'aarav@college.com', password: 'Aarav@123', role: 'student' },
  { id: 'student-priya', name: 'Priya', email: 'priya@college.com', password: 'Priya@123', role: 'student' },
  { id: 'student-rahul', name: 'Rahul', email: 'rahul@college.com', password: 'Rahul@123', role: 'student' },
  { id: 'student-ananya', name: 'Ananya', email: 'ananya@college.com', password: 'Ananya@123', role: 'student' },
  { id: 'student-ishita', name: 'Ishita', email: 'ishita@college.com', password: 'Ishita@123', role: 'student' },
]

export function getDashboardPath(role) {
  return role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
}

export const seedAssignments = [
  {
    id: 'react-fundamentals',
    title: 'React Fundamentals',
    description: 'Learn the fundamentals of React, including components, JSX, props, state, event handling, hooks, and building reusable user interfaces.',
    dueDate: '2026-11-15',
    driveLink: 'https://docs.google.com/document/d/1knTDEMdZZTZ55tiQZEcj1uXEB0tA7JRiK2QaClUPvPk/edit?usp=sharing',
    creatorId: 'admin-sharma',
    assignedStudentIds: ['student-aarav', 'student-priya', 'student-rahul'],
    submissions: {
      'student-aarav': 'submitted',
      'student-priya': 'pending',
      'student-rahul': 'submitted',
    },
  },
  {
    id: 'javascript-es6-concepts',
    title: 'JavaScript ES6 Concepts',
    description: 'Explore modern JavaScript ES6 features, including let and const, arrow functions, template literals, destructuring, spread and rest operators, promises, and modules.',
    dueDate: '2026-10-30',
    driveLink: 'https://docs.google.com/document/d/16mFGs77A7qZdN0hRU2aWgqGptOk4_-MLtSB1GSTppC4/edit?usp=sharing',
    creatorId: 'admin-mehta',
    assignedStudentIds: ['student-priya', 'student-ananya', 'student-ishita'],
    submissions: {
      'student-priya': 'submitted',
      'student-ananya': 'pending',
      'student-ishita': 'pending',
    },
  },
  {
    id: 'database-management',
    title: 'Database Management',
    description: 'Study database management concepts, including database models, SQL queries, relational databases, normalization, keys, and transaction management.',
    dueDate: '2026-11-12',
    driveLink: 'https://docs.google.com/document/d/1Iv8lmS5DCqDdsm0QXUt_jkRU_DKClBSgfG9A08lT5v0/edit?usp=drive_link',
    creatorId: 'admin-sharma',
    assignedStudentIds: ['student-aarav', 'student-ananya'],
    submissions: {
      'student-aarav': 'pending',
      'student-ananya': 'submitted',
    },
  },
  {
    id: 'data-structures-algorithms',
    title: 'Data Structures and Algorithms',
    description: 'Practice fundamental data structures and algorithms, including arrays, linked lists, stacks, queues, trees, searching, sorting, and complexity analysis.',
    dueDate: '2026-10-28',
    driveLink: 'https://docs.google.com/document/d/18TkIuTN1yw_hHFFiG-nFR8CtlXCjjd6S6I7B7jX_XCw/edit?usp=drive_link',
    creatorId: 'admin-mehta',
    assignedStudentIds: ['student-rahul', 'student-ishita'],
    submissions: {
      'student-rahul': 'pending',
      'student-ishita': 'submitted',
    },
  },
  {
    id: 'web-development-project',
    title: 'Web Development Project',
    description: 'Design and develop a responsive web project using HTML, CSS, JavaScript, and React. Demonstrate component-based development, functionality, and responsive design.',
    dueDate: '2026-11-20',
    driveLink: 'https://docs.google.com/document/d/1o2u6XnAIHGcDHuiX_O5II1joPY8Gg_iD0bKATsxukBo/edit?usp=drive_link',
    creatorId: 'admin-sharma',
    assignedStudentIds: [
      'student-aarav',
      'student-priya',
      'student-rahul',
      'student-ananya',
      'student-ishita',
    ],
    submissions: {
      'student-aarav': 'pending',
      'student-priya': 'submitted',
      'student-rahul': 'pending',
      'student-ananya': 'submitted',
      'student-ishita': 'pending',
    },
  },
]
