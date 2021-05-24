import Joi from 'joi';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

const app = express();
app.use(express.json());
const port = process.env.PORT || 1227;



//Set options for swaggerJsDoc (OpenAPI)
const openApiOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sample Students API for a university project',
            contact: {
                name: "86x on GitHub",
                url: "https://github.com/86x/example-openapi-swagger-jsdoc"
            }, 
            version: '1.0.0',
            servers: [`http://localhost:${port}`]
        }
    }, 
    apis: ['index.js', 'additionalOpenApiDocs.js']
};
const openApiDocs = await swaggerJsDoc(openApiOptions);
//Make OpenAPI description file available as json file
app.get('/api/docs/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiDocs);
});
//Serve Swagger UI (OpenAPI) Documentation
app.use ('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocs));



let students = [
    { matrNum: 1230000033, firstName: "Jack",    lastName: "Daniels", cantineCredit: 24.5 },
    { matrNum: 1230000026, firstName: "Jim",     lastName: "Beam",    cantineCredit: 1.0 },
    { matrNum: 1230000039, firstName: "Charlie", lastName: "Harper",  cantineCredit: 122000.4 }
];


app.get('/', (req, res) => {
    res.send("<h1>It works!</h1>");
});


/**
 * @openapi
 * /api/v1/students:
 *  parameters:
 *      - $ref: "#/components/parameters/sortBy"
 *  get:
 *      summary: Gets all students
 *      description: Returns all students
 *      tags: 
 *          - Students
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/students"
 *                      example:
 *                          - matrNum: 1230000001
 *                            firstName: "John"
 *                            lastName: "Doe"
 *                            cantineCredit: 12.5
 *                          - matrNum: 1230000003
 *                            firstName: "Simeon"
 *                            lastName: "Yetarian"
 *                            cantineCredit: 123000.4
 *                          - matrNum: 1230000010
 *                            firstName: "Michael without a last name"
 *                            lastName: null
 *                            cantineCredit: 999999.99
 */
app.get('/api/v1/students', (req, res) => {
    //If sortBy query-parameter is set, sort by firstName, lastName or default to matrNum if unknown
    if(req.query && req.query.sortBy){
        let studentsClone = [...students];
        switch(req.query.sortBy){
            case "firstName":
                //Sort by Name: Thx https://stackoverflow.com/a/6712058
                return res.send(studentsClone.sort((a, b) => a.firstName.localeCompare(b.firstName)));
            case "lastName":
                return res.send(studentsClone.sort((a, b) => a.lastName.localeCompare(b.lastName)));
            default:
                return res.send(studentsClone.sort((a, b) => a.matrNum - b.matrNum));
        }
    }

    //Return all students to user
    res.send(students);
});



/**
 * @openapi
 * /api/v1/student/{matrNum}:
 *  parameters:
 *      - $ref: "#/components/parameters/matrNum"
 *  get:
 *      summary: Gets a single student
 *      description: Gets a student with the specified matrNum or return an error message if no student with this matrNum exists.
 *      tags:
 *          - Students
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/student"
 *          404:
 *              description: No student with the specified matrNum exists
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/errorResponse"
 *                      example:
 *                          error: 
 *                              "This student was not found"
 */
app.get('/api/v1/student/:matrNum', (req, res) => {
    const student = findStudent(req.params.matrNum);

    //If student does not exist, send 404 Not Found error
    if(!student){
        return res.status(404).send({error: "This student was not found"});
    }

    //Return student object to user
    res.send(student);
});



/**
 * @openapi
 * /api/v1/students/add:
 *  post:
 *      summary: Add a single student
 *      description: Adds a student with the specified firstName and lastName. The matrNum is automatically generated and cantineCredit will be zero.
 *      tags:
 *          - Students
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          firstName:
 *                              $ref: "#/components/schemas/firstName"
 *                          lastName:
 *                              $ref: "#/components/schemas/lastName"
 *      responses:
 *          201:
 *              description: Created
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/student"
 *          400:
 *              description: Invalid input
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/errorResponse"
 *                      example:
 *                          error: 
 *                              "\"firstName\" is required"
 */
app.post('/api/v1/students/add', (req, res) => {
    //Validate POST user input
    const { error } = validateStudent(req.body, true);

    //If POST user input is invalid, send 400 Bad Request error
    if(error !== undefined){
        return res.status(400).send({ error: error.details[0].message });
    }

    //Generate a new matrNum by adding 1 to the currently highest matrNum
    const newMatrNum = Math.max.apply(Math, students.map(function(o) { return o.matrNum + 1; }));

    //Build new student object
    const newStudent = {
        matrNum: newMatrNum,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        cantineCredit: 0.0
    };

    //Add new student object to students
    students.push(newStudent);
    console.log(`Added new student ${newStudent.firstName + " " + newStudent.lastName} with matrNum ${newMatrNum}`);
    
    //Return created student
    res.status(201).send(newStudent);
});



/**
 * @openapi
 * /api/v1/student/{matrNum}:
 *  parameters:
 *      - $ref: "#/components/parameters/matrNum"
 *  put:
 *      summary: Updates a student's info
 *      description: Updates firstName, lastName or both at the same time of the student with the specified matrNum, if one exists.
 *      tags:
 *          - Students
 *      requestBody:
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          firstName:
 *                              $ref: "#/components/schemas/firstName"
 *                          lastName:
 *                              $ref: "#/components/schemas/lastName"
 *      responses:
 *          200:
 *              description: OK
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/student"
 *          404:
 *              description: No student with the specified matrNum exists
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/errorResponse"
 *                      example:
 *                          error: 
 *                              "This student was not found"
 */
app.put('/api/v1/student/:matrNum', (req, res) => {
    const student = findStudent(req.params.matrNum);

    //If student does not exist, send 404 Not Found error
    if(!student){
        return res.status(404).send({ error: "This student was not found" });
    }

    //Validate PUT user input
    const { error } = validateStudent(req.body, false);

    //If PUT user input is invalid, send 400 Bad Request error
    if(error !== undefined){
        return res.status(400).send(error.details[0].message);
    }

    //Update student's information
    if(req.body.firstName){ student.firstName = req.body.firstName; }
    if(req.body.lastName){  student.lastName  = req.body.lastName;  }
    

    //Return updated student to user
    res.send(student);
});



/**
 * @openapi
 * /api/v1/student/{matrNum}:
 *  parameters:
 *      - $ref: "#/components/parameters/matrNum"
 *  delete:
 *      summary: Deletes a student
 *      description: Immediately deletes the student with the specified matrNum, if one exists.
 *      tags:
 *          - Students
 *      responses:
 *          200:
 *              description: Deleted student successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/student"
 *          404:
 *              description: No student with the specified matrNum exists
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: "#/components/schemas/errorResponse"
 *                      example:
 *                          error: 
 *                              "This student was not found"
 */
app.delete('/api/v1/student/:matrNum', (req, res) => {
    const student = findStudent(req.params.matrNum);

    //If student does not exist, send 404 Not Found error
    if(!student){
        return res.status(404).send({ error: "This student was not found" });
    }

    //Delete student
    const studentIndex = students.indexOf(student);
    students.splice(studentIndex, 1);

    //Return deleted student to user
    res.send(student);
});



app.listen(port, () => console.log(`Listening on port ${port}`));



/**
 * Checks that the specified student object contains a firstName of type string which consists 
 * of at least 1 character and a lastName of type string which consists of at least 1 character
 * @param student object with a firstName and lastName attribute
 * @param requireAll If true, firstName and lastName are required. If false, only what is sent is being validated.
 * @returns 
 */
function validateStudent(student, requireAll){
    if(requireAll){
        var inputSchema = Joi.object({
            firstName: Joi.string().min(1).required(), 
            lastName: Joi.string().min(1).required()
        });
        return inputSchema.validate(student);
    } else{
        var inputSchema = Joi.object({
            firstName: Joi.string().min(1), 
            lastName: Joi.string().min(1)
        });
        return inputSchema.validate(student);
    }
}



/**
 * Finds a student in the students array and returns it, if one is found.
 * @param matrNum matrNum of student object in students
 * @returns student object
 */
function findStudent(matrNum){
    return students.find(s => s.matrNum === parseInt(matrNum));
}