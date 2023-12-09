const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const result = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    category: dbObj.category,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  };
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}'  ;`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE  priority='${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status='${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => result(eachItem)));
      break;
    default:
      getTodosQuery = `SELECT * FROM todo ;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => result(eachItem)));
  }
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
     *
    FROM
       todo
    WHERE
       id=${todoId};`;
  const todosarr = await db.get(getTodoQuery);
  response.send(result(todosarr));
});
//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const responseDate = await db.all(requestQuery);
    response.send(responseDate.map((eachItem) => result(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const PostNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const PostTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES(${id},'${todo}','${priority}','${status}','${category}','${PostNewDate}');`;
          await db.run(PostTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
// API 5
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `SELECT * 
  From todo
   WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  console.log(previousTodo);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;
  let updateQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `UPDATE todo
         SET
          todo='${todo}',
          priority='${priority}',
          status='${status}',
          category='${category}',
          due_date='${dueDate}'
          WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //update Priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `UPDATE todo 
        SET 
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',due_date='${dueDate}'
        WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `UPDATE todo SET
         todo='${todo}',priority='${priority}',
         status='${status}',
         category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      updateQuery = `UPDATE todo SET
       todo='${todo}',priority='${priority}',
       status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${newDueDate}' WHERE id=${todoId};`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});
// API 5
app.delete(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const DeleteTodoQuery = `
  DELETE FROM todo
    WHERE id=${todoId}`;
  await db.run(DeleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
