const express = require('express');
const app = express();
const cors = require('cors');

const fs = require('fs');

let skillsPath = 'C:/Users/MrRya/OneDrive/Desktop/main/js/gat/challenger/src/app/skills/data.json';
let paragraphsPath = 'C:/Users/MrRya/OneDrive/Desktop/main/js/gat/challenger/src/app/paragraphs/data.json';

const readFile = (path) => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', (err, data) => {
			if (err) return reject(err);
			resolve(data);
		});
	});
};

app.use(cors());
app.use(express.json());
app.post('/', async (req, res) => {
	let { skill } = req.body;

	let path = skill == null ? paragraphsPath : skillsPath;
	
	try {
		let file = JSON.parse(await readFile(path));
		let ids = file
			.map((model) => model.questions)
			.flat()
			.map((question) => question.id)
			.sort((a, b) => b - a);
	
		res.send({ id: ids[0] + 1 });
	} catch(e) {}
	
});

app.listen(3000);
