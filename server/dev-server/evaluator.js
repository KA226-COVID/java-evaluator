import EvaluationReport from '../../evaluation-report/evaluation-report'
import 'regenerator-runtime/runtime'

async function evalJava(programmingExercise, evalReq) {
    let evalRes = new EvaluationReport();
    evalRes.setRequest(evalReq.request)
    let program = evalReq.request.program
    let response = {}
    response.report = {}
    response.report.capability = {
        "id": "Java-evaluator",
        "features": [{
            "name": "language",
            "value": "Java"
        }, {
            "name": "version",
            "value": "1.0"
        }, {
            "name": "engine",
            "value": "https://www.npmjs.com/package/java"
        }]
    }
    response.report.exercise = programmingExercise.id
    try {

        let solution_id = ""
        for (let solutions of programmingExercise.solutions) {
            if (solutions.lang == "java") {
                solution_id = solutions.id
                break;
            }
        }
        const solution = programmingExercise.solutions_contents[solution_id]
        let correct_anwsers = []
        for (let metadata of programmingExercise.tests) {
            let input = programmingExercise.tests_contents_in[metadata.id];
            let teacherNode = null,
                studentNode = null;
            var teacherResult = getOutputFromCode(
                solution,
                input
            )
            var studentResult = getOutputFromCode(
                program,
                input
            )
            await Promise.all([teacherResult, studentResult])
            .then(resultArray => {
                teacherNode = resultArray[0];
                studentNode = resultArray[1];
                if (teacherNode != studentNode) {
                    if ('request' in evalRes)
                        delete evalRes.request
                    response.report.compilationErrors = "incorrect java solution"
                    console.log("1.- evalRes.setReply " + evalRes.setReply(response))
                } else {
                    console.log("2.- evalRes.setReply " + evalRes.setReply(response))
                }
                return evalRes
            })
            .catch(e => {
                console.log("3.- evalRes.setReply " + evalRes.setReply(e));
                return evalRes
            })
        }

    } catch (error) {
        console.log(error)
        response.report.compilationErrors = JSON.stringify(error)
        console.log("4.- evalRes.setReply " + evalRes.setReply(response))
        return evalRes
    }
}


const getOutputFromCode = (answerCode, input) => {
    return new Promise((resolve, reject) => {
        var util  = require('util'),
            execFile = require('child_process').execFile,
            output = ''; 
        createFileFromCode(answerCode)
        .then(info => {
              const child = execFile('java', ['-Duser.language=es', '-Duser.region=ES', info.path],
                  {
                    // stdio: ['pipe', process.stdout, process.stderr],
                    timeout: 5000,
                    maxBuffer: 65535
                  });

                child.stdin.setEncoding = 'utf-8';

                child.stdout.on('data', (data) => {
                    output += data.toString();
                });

                // Handle error output
                child.stderr.on('data', (data) => {
                    reject(data);
                });
                child.stdout.on('end', async function(code){
                    resolve(output);
                });

              process.stdin.pipe(child.stdin);
              child.stdin.write(input + '\n');
        })
        .catch(e => {
                console.log("error " + e);
                reject(e);
            });
    })
}

const createFileFromCode = (answerCode) => {
    return new Promise((resolve, reject) => {
        var temp = require('temp'),
            fs   = require('fs')
         
        // Automatically track and cleanup files at exit
        temp.track();
         
        // Process the data (note: error handling omitted)
        temp.open({suffix: '.java'}, function(err, info) {
          if (!err) {
            fs.write(info.fd, answerCode, (err) => {
                if(err) reject(err);
            });
            fs.close(info.fd, function(err) {
              if(err) reject(err);
              resolve(info);
            });
          }
        });
    })
}

module.exports = {
    evalJava
}
