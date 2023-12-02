const { Department, Role, Employee } = require("./Models");

const sequelize = require("./connection");

const inquirer = require("inquirer");

sequelize.sync({ force: false }).then(() => {
    options();
});

function options() {
    inquirer
    .prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: [
            "View All Departments",
            "View All Roles",
            "View All Employees",
            "Add Department",
            "Add Role",
            "Add Employee",
            "Update Employee Role",
            ],
        name: "employeeTracker",
        },
    ])

    .then((answer) => {
        if (answer.employeeTracker === "View All Departments") {
            viewAllDepartments();
        } else if (answer.employeeTracker === "View All Roles") {
            viewAllRoles();
        } else if (answer.employeeTracker === "View All Employees") {
            viewAllEmployees();
        } else if (answer.employeeTracker === "Add Department") {
            addDepartment();
        } else if (answer.employeeTracker === "Add Role") {
            addRole();
        } else if (answer.employeeTracker === "Add Employee") {
            addEmployee();
        }else {
            updateEmployeeRole();
        }
    });
}

const viewAllDepartments = () => {
    var departments = Department.findAll({ raw: true }).then((data) => {
    console.table(data);
    options();
    });
};

const viewAllRoles = () => {
    var roles = Role.findAll({
    raw: true,
    include: [{ model: Department }],
    }).then((data) => {
    console.table(
        data.map((role) => {
        return {
            id: role.id,
            title: role.title,
            salary: role.salary,
            department: role["Department.name"],
        };
        })
    );
    options();
    });
};

const viewAllEmployees = () => {
    var employees = Employee.findAll({
    raw: true,
    include: [{ model: Role, include: [{ model: Department }] }],
    }).then((data) => {
    const employeeLookup = {};
    for (var i = 0; i < data.length; i++) {
        const employee = data[i];
        employeeLookup[employee.id] =
        employee.first_name + " " + employee.last_name;
    }
    console.table(
        data.map((employee) => {
        return {
            id: employee.id,
            first_name: employee.first_name,
            last_name: employee.last_name,
            title: employee["Role.title"],
            department: employee["Role.Department.name"],
            salary: employee["Role.salary"],
            manager: employeeLookup[employee.manager_id],
        };
        })
    );
    options();
    });
};

const addDepartment = () => {
    inquirer
    .prompt([
        {
            type: "input",
            message: "What would you like to name the department?",
            name: "addDepartment",
        },
    ])
    .then((answer) => {
        Department.create({ name: answer.addDepartment }).then((data) => {
        options();
        });
    });
};

const addRole = async () => {
    let departments = await Department.findAll({
    attributes: [
        ["id", "value"],
        ["name", "name"],
    ],
    });

    departments = departments.map((department) =>
    department.get({ plain: true })
    );

    inquirer
    .prompt([
        {
            type: "input",
            message: "What is the name of the role?",
            name: "title",
        },
        {
            type: "input",
            message: "What would you like the salary to be?",
            name: "salary",
        },
        {
            type: "list",
            message: "What department would you like to add this new role to?",
            name: "department_id",
            choices: departments,
        },
    ])

    .then((answer) => {
        Role.create(answer).then((data) => {
        options();
        });
    });
};

const addEmployee = async () => {
    let roles = await Role.findAll({
    attributes: [
        ["id", "value"],
        ["title", "name"],
    ],
    });

    roles = roles.map((role) => role.get({ plain: true }));

    let managers = await Employee.findAll({
    attributes: [
        ["id", "value"],
        ["first_name", "name"],
        ["last_name", "lastName"],
    ],
    });

    managers = managers.map((manager) => {
    manager.get({ plain: true });
    const managerInfo = manager.get();
    return {
        name: `${managerInfo.name} ${managerInfo.lastName}`,
        value: managerInfo.value,
    };
    });
    managers.push({ type: "Null Manager", value: null });

    inquirer
    .prompt([
        {
            type: "input",
            message: "What is the first name of the new employee?",
            name: "first_name",
        },
        {
            type: "input",
            message: "What is the last name of the new employee?",
            name: "last_name",
        },
        {
            type: "list",
            message: "What is the role of the new employee?",
            name: "role_id",
            choices: roles,
        },
        {
            type: "list",
            message: "What manager would you like to assign to the new employee?",
            name: "manager_id",
            choices: managers,
        },
    ])
    .then((answer) => {
        Employee.create(answer).then((data) => {
        options();
        });
    });
};

const updateEmployeeRole = async () => {
    let employees = await Employee.findAll({
    attributes: [
        ["id", "value"],
        ["first_name", "name"],
        ["last_name", "lastName"],
    ],
    });

    employees = employees.map((employee) => {
    employee.get({ plain: true });
    const employeeInfo = employee.get();
    return {
        name: `${employeeInfo.name} ${employeeInfo.lastName}`,
        value: employeeInfo.value,
    };
    });

    let roles = await Role.findAll({
    attributes: [
        ["id", "value"],
        ["title", "name"],
    ],
    });

    roles = roles.map((role) => role.get({ plain: true }));

    inquirer
    .prompt([
        {
            type: "list",
            message: "Who is the employee whose role you would like to update?",
            name: "id",
            choices: employees,
        },
        {
            type: "list",
            message:
            "What is the name of the updated role would you like to assign to this employee?",
            name: "role_id",
            choices: roles,
        },
    ])
    .then((answer) => {
        Employee.update(answer, {
        where: {
            id: answer.id,
        },
        }).then((data) => {
        options();
        });
    });
};