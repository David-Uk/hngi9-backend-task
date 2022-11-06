const fs = require("fs");
const fsp = fs.promises;
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");
const { createHash } = require("crypto");

let teamName;
const writableStream = fs.createWriteStream(`./csv/sample.output.csv`);

let hash = [];
let rows = [];

const writeToCSV = () => {
    // This defines the columns of the new csv file
    const columns = [
        "TEAM NAMES",
        "Series Number",
        "Filename",
        "Name",
        "Description",
        "Gender",
        "Attributes",
        "UUID",
        "Hash",
    ];

    // This writes the columns of the new csv file
    const csv_writer = stringify({ header: true, columns: columns });

    // This writes the data of the new csv file
    for (let i = 0; i < rows.length; i++) {
        rows[i].push(hash[i]); // Push the hash into the rowws array
        csv_writer.write(rows[i]);
    }

    // console.log(rows.length);
    csv_writer.pipe(writableStream); // This pipes the data to the new csv file

    console.log("Finished writing data"); // This logs that the data has been written to the new csv file
}


const createFileAndHash = async () => {
    for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] != "") {
            teamName = rows[i][0];
        }

        let json = {
            format: "CHIP-0007",
            name: rows[i][3],
            description: rows[i][4],
            minting_tool: teamName,
            sensitive_content: false,
            series_number: rows[i][1],
            $id: rows[i][7],
            series_total: 420,
            attributes: [
                {
                    trait_type: "gender",
                    value: rows[i][5],
                },
            ],
            collection: {
                name: "Zuri NFT Tickets for Free Lunch",
                id: "b774f676-c1d5-422e-beed-00ef5510c64d",
                attributes: [
                    {
                        type: "description",
                        value: "Rewards for accomplishments during HNGi9.",
                    },
                ],
            },
            data: {}
        };

        let attributes = rows[i][6];

        let attributesArray = attributes.split(";");

        for (let j = 0; j < attributesArray.length; j++) {
            let arr = attributesArray[j].split(":");

            if (arr[0] != "") {
                let obj = {
                    trait_type: arr[0].trim(),
                    value: arr[1] != "" ? arr[1].trim() : "",
                };

                json.attributes.push(obj);
            }
        }
        await fsp.writeFile(`./jsonfiles/${rows[i][2]}.json`, JSON.stringify(json));

        let buff = await fsp.readFile(`./${rows[i][2]}.json`);

        const hashed = createHash("sha256").update(buff).digest("hex");

        hash.push(hashed);
    }

    writeToCSV();
}


fs.createReadStream(`./csv/sample.csv`)
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", async function (row) {
        rows.push(row);
    })
    .on("end", function () {
        console.log("finished");

        createFileAndHash();
    })
    .on("error", function (error) {
        console.log(error.message);
    });
