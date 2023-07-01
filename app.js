const express = require("express");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};
initializeDBAndServer();

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result);
      const isValidDate = await isValid(result);
      console.log(isValidDate);
      if (isValidDate) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const checkRequestsBody = async (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = await isValid(result);
      console.log(isValidDate);
      if (isValidDate) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  request.todo = todo;
  request.id = id;
  request.todoId = todoId;
  next();
};

// API 1
app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const { status = "", priority = "", category = "", search_q = "" } = request;

  const getquery = `select * from todo where status like'%${status}%' and 
  category like'%${category}%' and priority like'%${priority}%' and todo like '%${search_q}%';`;
  const res = await db.all(getquery);
  response.send(
    res.map((obj) => {
      return {
        id: obj.id,
        todo: obj.todo,
        priority: obj.priority,
        status: obj.status,
        category: obj.category,
        dueDate: obj.due_date,
      };
    })
  );
});

//API 2
app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request;
  const getQuery = `
    select * from todo where id = ${todoId};
    `;
  const obj = await db.get(getQuery);
  response.send({
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  });
});

//API 3
app.get("/agenda/", checkRequestsQueries, async (request, response) => {
  const { date } = request;
  console.log(date);
  const getQuery = `
    select 
    id,
    todo,
    priority,
    status,
    category,
    due_date as dueDate
    from todo where due_date = '${date}';
    `;
  const obj = await db.all(getQuery);
  if (obj === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(obj);
  }
});

//API 4
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  const postQuery = `
  insert into todo (id, todo, priority, status, category, due_date )
  values (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');
  `;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

// API 5
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { status, priority, todo, category, dueDate } = request;
  const { todoId } = request;
  switch (true) {
    case status !== undefined:
      const statusQuery = `update todo set status = '${status}' where id = ${todoId};`;
      await db.run(statusQuery);
      response.send("Status Updated");
      break;
    case category !== undefined:
      const categoryQuery = `update todo set category = '${category}' where id = ${todoId};`;
      await db.run(categoryQuery);
      response.send("Category Updated");
      break;
    case priority !== undefined:
      const priorityQuery = `update todo set priority = '${priority}' where id = ${todoId};`;
      await db.run(priorityQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      const todoQuery = `update todo set todo = '${todo}' where id = ${todoId};`;
      await db.run(todoQuery);
      response.send("Todo Updated");
      break;
    case dueDate !== undefined:
      const dueDateQuery = `update todo set due_date = '${dueDate}' where id = ${todoId};`;
      await db.run(dueDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request;
  const delQuery = `
delete from todo where id = ${todoId};
    `;
  await db.run(delQuery);
  response.send("Todo Deleted");
});

module.exports = app;
