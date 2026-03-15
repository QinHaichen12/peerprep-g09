const tokenInput = document.getElementById("token");
const difficultyFilterInput = document.getElementById("difficultyFilter");
const topicFilterInput = document.getElementById("topicFilter");
const loadQuestionsButton = document.getElementById("loadQuestionsButton");
const seedQuestionsButton = document.getElementById("seedQuestionsButton");
const saveQuestionButton = document.getElementById("saveQuestionButton");
const resetFormButton = document.getElementById("resetFormButton");
const questionsList = document.getElementById("questionsList");
const statusMessage = document.getElementById("statusMessage");

const formFields = {
  questionId: document.getElementById("questionId"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  difficulty: document.getElementById("difficulty"),
  topics: document.getElementById("topics"),
  constraints: document.getElementById("constraints"),
  examples: document.getElementById("examples"),
  sourceUrl: document.getElementById("sourceUrl"),
  imageUrl: document.getElementById("imageUrl"),
};

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.className = isError ? "error" : "muted";
};

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${tokenInput.value.trim()}`,
});

const buildQueryString = () => {
  const params = new URLSearchParams();

  if (difficultyFilterInput.value) {
    params.set("difficulty", difficultyFilterInput.value);
  }

  if (topicFilterInput.value.trim()) {
    params.set("topic", topicFilterInput.value.trim());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const resetForm = () => {
  Object.values(formFields).forEach((field) => {
    field.value = "";
  });

  formFields.difficulty.value = "easy";
};

const getPayloadFromForm = () => {
  let parsedExamples = [];

  if (formFields.examples.value.trim()) {
    parsedExamples = JSON.parse(formFields.examples.value);
  }

  return {
    title: formFields.title.value,
    description: formFields.description.value,
    difficulty: formFields.difficulty.value,
    topics: formFields.topics.value
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean),
    constraints: formFields.constraints.value
      .split("\n")
      .map((constraint) => constraint.trim())
      .filter(Boolean),
    examples: parsedExamples,
    sourceUrl: formFields.sourceUrl.value.trim(),
    imageUrl: formFields.imageUrl.value.trim(),
  };
};

const populateForm = (question) => {
  formFields.questionId.value = question.id;
  formFields.title.value = question.title || "";
  formFields.description.value = question.description || "";
  formFields.difficulty.value = question.difficulty || "easy";
  formFields.topics.value = (question.topics || []).join(", ");
  formFields.constraints.value = (question.constraints || []).join("\n");
  formFields.examples.value = JSON.stringify(question.examples || [], null, 2);
  formFields.sourceUrl.value = question.sourceUrl || "";
  formFields.imageUrl.value = question.imageUrl || "";
};

const renderQuestions = (questions) => {
  if (!questions.length) {
    questionsList.innerHTML = "<p class='muted'>No questions found.</p>";
    return;
  }

  questionsList.innerHTML = questions
    .map(
      (question) => `
        <article class="question-card">
          <div class="question-card-header">
            <div>
              <h3>${question.title}</h3>
              <p>${question.description}</p>
            </div>
            <span class="badge">${question.difficulty}</span>
          </div>
          <p><strong>Topics:</strong> ${(question.topics || []).join(", ")}</p>
          <div class="actions">
            <button data-action="edit" data-id="${question.id}">Edit</button>
            <button data-action="delete" data-id="${question.id}" class="danger">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
};

const loadQuestions = async () => {
  try {
    setStatus("Loading questions...");
    const response = await fetch(`/api/questions${buildQueryString()}`, {
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.join(", ") || "Failed to load questions.");
    }

    renderQuestions(data);
    setStatus(`Loaded ${data.length} question(s).`);
  } catch (error) {
    setStatus(error.message, true);
  }
};

const saveQuestion = async () => {
  try {
    const questionId = formFields.questionId.value.trim();
    const method = questionId ? "PATCH" : "POST";
    const endpoint = questionId ? `/api/questions/${questionId}` : "/api/questions";

    setStatus(questionId ? "Updating question..." : "Creating question...");

    const response = await fetch(endpoint, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(getPayloadFromForm()),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.join(", ") || "Failed to save question.");
    }

    resetForm();
    await loadQuestions();
    setStatus(`Question "${data.title}" saved successfully.`);
  } catch (error) {
    setStatus(error.message, true);
  }
};

const seedQuestions = async () => {
  try {
    setStatus("Seeding sample questions...");
    const response = await fetch("/api/questions/seed", {
      method: "POST",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to seed sample questions.");
    }

    await loadQuestions();
    setStatus(data.message);
  } catch (error) {
    setStatus(error.message, true);
  }
};

const deleteQuestion = async (questionId) => {
  try {
    setStatus("Deleting question...");
    const response = await fetch(`/api/questions/${questionId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete question.");
    }

    await loadQuestions();
    setStatus(data.message);
  } catch (error) {
    setStatus(error.message, true);
  }
};

questionsList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "edit") {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        headers: getHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load question details.");
      }

      populateForm(data);
      setStatus(`Loaded "${data.title}" into the form.`);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  if (action === "delete") {
    await deleteQuestion(id);
  }
});

loadQuestionsButton.addEventListener("click", loadQuestions);
seedQuestionsButton.addEventListener("click", seedQuestions);
saveQuestionButton.addEventListener("click", saveQuestion);
resetFormButton.addEventListener("click", resetForm);

resetForm();
