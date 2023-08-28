let skills = {
	'التناظر اللفظي': 'verbal-analogy',
	'إكمال الجمل': 'sentence-completion',
	'الخطأ السياقي': 'contextual-error',
	'استيعاب المقروء': null,
};

const copy = (object) => {
	let string = JSON.stringify(object);
	navigator.clipboard.writeText(string);
};

const getAllQuestions = () => {
	let questions = Array.from(document.querySelectorAll('div[role="list"] > div[role="listitem"]:not(:first-child)'));

	questions = questions.filter((question) => {
		return Array.from(question.firstChild.children).some((child) => {
			return child.getAttribute('jscontroller') != null;
		});
	});

	return questions;
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

	let question = element.querySelector('div[role="heading"] > span');
	question = question.innerHTML.replaceAll(/\n/g, '').trim();

	let object = {
		'question': question,
		'answers': answers,
		'true': correctAnswer,
	};

	return [object, labels.length == 4];
};

const getSkill = (element) => {
	let title = element.parentElement.querySelector('div:first-child > div[role="heading"] > div > div:first-child').textContent.trim();
	let skill = skills[title];
	return skill;
};

const analyzeQuestion = (element, id) => {
	let skill = getSkill(element);

	let [object, correct] = parseQuestion(element);
	if (skill) {
		object.skill = skill;
	}

	object.status = `missing${!correct ? ' && incorrect' : ''}`;
	object.id = id;

	return object;
};

const copyAll = async () => {
	let questions = getAllQuestions();

	let normal = [];
	let paragraphs = [];

	questions.map((question) => {
		let skill = getSkill(question);

		if (skill == null) {
			paragraphs.push(question);
		} else {
			normal.push(question);
		}
	});

	let normalLatest = await getLatestId('verbal-analogy');
	let paragraphsLatest = await getLatestId(null);

	normal = normal.map((question, index) => analyzeQuestion(question, normalLatest + index));
	paragraphs = paragraphs.map((question, index) => analyzeQuestion(question, paragraphsLatest + index));

	let parsed = [normal, paragraphs];

	parsed = parsed.filter((e) => e.length != 0).flat();

	copy(parsed);
};

const inject = () => {
	// Copy all button
	let parent = document.querySelector('body > div > div:nth-child(2) > div:nth-child(1) > div');
	let child = document.createElement('div');

	escapeHTMLPolicy = trustedTypes.createPolicy('forceInner', {
		createHTML: (to_escape) => to_escape,
	});

	child.innerHTML = escapeHTMLPolicy.createHTML("<button id='copy-all-btn' style='width: 100%; font-size: 20px; padding: 5px;'>Copy all</button>");

	parent.insertBefore(child, parent.firstChild);

	document.getElementById('copy-all-btn').addEventListener('click', copyAll);
};

const main = () => {
	setTimeout(function () {
		inject();
	}, 1000);

	let questions = getAllQuestions();

	questions.map((question) => {
		// Hovering
		let child = question.querySelector('div');
		question.addEventListener('mouseenter', () => {
			child.style = 'background-color: rgb(225, 225, 225);';
		});
		question.addEventListener('mouseleave', () => {
			child.style = 'background-color: white;';
		});

		// Copy on click
		question.addEventListener('mousedown', async () => {
			let skill = getSkill(question);
			let id = await getLatestId(skill);
			let object = analyzeQuestion(question, id);

			copy(object);
		});
	});
};

let url = window.location.href;
if (url.match(/https:\/\/docs.google.com\/forms\/d\/e\/.*\/viewscore\?viewscore=/g)) {
	main();
}
