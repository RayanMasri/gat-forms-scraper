let skills = {
	'التناظر اللفظي': 'verbal-analogy',
	'إكمال الجمل': 'sentence-completion',
	'الخطأ السياقي': 'contextual-error',
	'استيعاب المقروء': null,
};

const getLatestId = (skill) => {
	return new Promise((resolve, reject) => {
		fetch('http://localhost:3000/', {
			method: 'POST',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				skill: skill,
			}),
		}).then(async (response) => {
			let { id } = await response.json();

			resolve(id);
		});
	});
};

const parseQuestion = (element) => {
	let labels = Array.from(element.querySelectorAll('label'));

	let correctAnswer = '';
	let answers = labels.slice(0, 4).map((e) => e.textContent.trim().replace(/\n/g, ''));
	if (labels.length == 5) {
		correctAnswer = labels[4].textContent.trim();
	} else {
		for (let answer of answers) {
			if (answer.includes('Correct')) {
				correctAnswer = answer.replace('Correct', '');
			}
		}
	}

	answers = answers.map((e) => {
		e = e.replace('Incorrect', '');
		e = e.replace('Correct', '');
		return e;
	});

	let question = element.querySelector('div[role="heading"] > span').textContent.trim().replace(/\n/g, '');

	let object = {
		'question': question,
		'answers': answers,
		'true': correctAnswer,
	};

	return [object, labels.length == 4];
};

const main = () => {
	let questions = Array.from(document.querySelectorAll('div[role="list"] > div[role="listitem"]:not(:first-child)'));

	questions = questions.filter((question) => {
		return Array.from(question.firstChild.children).some((child) => {
			return child.getAttribute('jscontroller') != null;
		});
	});

	// questions = questions.map((question) => {
	// 	return question.querySelector('div[role="heading"] > span').textContent.trim();
	// });

	questions.map((question) => {
		let child = question.querySelector('div');

		question.addEventListener('mouseenter', () => {
			child.style = 'background-color: rgb(225, 225, 225);';
		});

		question.addEventListener('mouseleave', () => {
			child.style = 'background-color: white;';
		});

		question.addEventListener('mousedown', async () => {
			let title = question.parentElement.querySelector('div:first-child > div[role="heading"] > div > div:first-child').textContent.trim();
			let skill = skills[title];

			let id = await getLatestId(skill);

			let [object, correct] = parseQuestion(question);
			if (skill) {
				object.skill = skill;
			}

			object.status = `missing${!correct ? ' && incorrect' : ''}`;
			object.id = id;

			navigator.clipboard.writeText(JSON.stringify(object));
		});
	});
};

let url = window.location.href;
if (url.match(/https:\/\/docs.google.com\/forms\/d\/e\/.*\/viewscore\?viewscore=/g)) {
	main();
}
