/**
 * @openapi
 * components:
 *  parameters:
 *    matrNum:
 *      description: Matriculation number of the student
 *      name: matrNum
 *      in: path
 *      required: true
 *      schema:
 *        $ref: "#/components/schemas/matrNum"
 *    sortBy:
 *      description: Sort objects by specified value
 *      name: sortBy
 *      in: query
 *      required: false
 *      schema:
 *        $ref: "#/components/schemas/sortBy"
 *  schemas:
 *    student:
 *      type: object
 *      properties:
 *        matrNum:
 *          $ref: "#/components/schemas/matrNum"
 *        firstName:
 *          $ref: "#/components/schemas/firstName"
 *        lastName:
 *          $ref: "#/components/schemas/lastName"
 *        cantineCredit:
 *          $ref: "#/components/schemas/cantineCredit"
 *    students:
 *      type: array
 *      items:
 *        $ref: "#/components/schemas/student"
 *    matrNum:
 *      type: integer
 *      example: 1230000039
 *    firstName:
 *      type: string
 *      example: "John"
 *      nullable: true
 *    lastName:
 *      type: string
 *      example: "Doe"
 *      nullable: true
 *    cantineCredit:
 *      type: double
 *      description: Cantine credit in EUR
 *      example: 12.5
 *    sortBy:
 *      type: string
 *      enum: ["firstName", "lastName", "matrNum"]
 *      description: Possible values to sort by.
 *      example: "firstName"
 *    error:
 *      type: string
 *      maxLength: 512
 *      description: Error message explaining why the request was not successful
 *    errorResponse:
 *      type: object
 *      properties:
 *        error:
 *          $ref: "#/components/schemas/error"
 */