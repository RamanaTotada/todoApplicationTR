const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;
const initilationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("server running at http://localhost:3000/")
    );
  } catch (Error) {
    console.log(`Db Error ${Error.message}`);
    process.exit(1);
  }
};
initilationDbAndServer();

//todoTable DataBase
const convertDbObjectToResponseObject = (DbObject) => {
  return {
    id: DbObject.id,
    todo: DbObject.todo,
    priority: DbObject.priority,
    status: DbObject.status,
  };
};

// /todos/   /todos/?status=TO%20DO

const priorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case priorityAndStatusProperties(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case priorityProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case statusProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

// /todos/:todoId/

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const todoIdspecificquery = `
    SELECT * FROM todo
    WHERE
    id = ${todoId}
    ;`;

  const specificId = await db.get(todoIdspecificquery);
  response.send(specificId);
});

//post /todos/

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createTodoIdQuery = `
INSERT INTO 
todo(
   id,todo,priority,status 
)
values(
    ${id},"${todo}","${priority}","${status}"
)
;`;

  await db.run(createTodoIdQuery);
  response.send("Todo Successfully Added");
});

//put todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

///delete /todos/:todoId/

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const todoQueryDel = `
    DELETE FROM todo
    where 
    id = '${todoId}'
    ;`;
  await db.run(todoQueryDel);
  response.send("Todo Deleted");
});

module.exports = app;
