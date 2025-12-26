// Quiz Application Logic
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.isReviewMode = false;
        this.shuffleEnabled = true; // Default: shuffle questions enabled
        this.shuffleOptionsEnabled = false; // Default: shuffle options disabled
        this.shuffledOptions = []; // Store shuffled options for each question

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.chapterSelector = document.getElementById('chapterSelector');
        this.quizContainer = document.getElementById('quizContainer');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.questionText = document.getElementById('questionText');
        this.optionsContainer = document.getElementById('optionsContainer');
        this.explanation = document.getElementById('explanation');
        this.progressFill = document.getElementById('progressFill');
        this.questionNumber = document.getElementById('questionNumber');
        this.totalQuestions = document.getElementById('totalQuestions');
        this.scoreDisplay = document.getElementById('score');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.shuffleToggle = document.getElementById('shuffleToggle');
        this.shuffleOptionsToggle = document.getElementById('shuffleOptionsToggle');
        this.questionCountInput = document.getElementById('questionCount');
    }

    initEventListeners() {
        // Chapter selection buttons
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startQuiz(btn.dataset.chapter));
        });

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prevQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitBtn.addEventListener('click', () => this.showResults());

        // Shuffle toggle
        if (this.shuffleToggle) {
            this.shuffleToggle.addEventListener('change', (e) => {
                this.shuffleEnabled = e.target.checked;
            });
        }

        // Shuffle options toggle
        if (this.shuffleOptionsToggle) {
            this.shuffleOptionsToggle.addEventListener('change', (e) => {
                this.shuffleOptionsEnabled = e.target.checked;
            });
        }

        // Results buttons
        document.getElementById('reviewBtn').addEventListener('click', () => this.reviewAnswers());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartQuiz());
        document.getElementById('backToChaptersBtn').addEventListener('click', () => this.backToChapters());
    }

    startQuiz(chapter) {
        // Filter questions by chapter - NO LIMIT for 'all'
        if (chapter === 'all') {
            this.questions = [...allQuestions];
        } else if (chapter === '1') {
            this.questions = allQuestions.filter(q => q.chapter === 1 || q.chapter === 2);
        } else {
            this.questions = allQuestions.filter(q => q.chapter === parseInt(chapter));
        }

        // Shuffle questions only if enabled
        if (this.shuffleEnabled) {
            this.questions = this.shuffleArray(this.questions);
        }

        // Limit question count if specified
        const questionCount = this.questionCountInput ? parseInt(this.questionCountInput.value) : 0;
        if (questionCount > 0 && questionCount < this.questions.length) {
            this.questions = this.questions.slice(0, questionCount);
        }

        // Prepare shuffled options for each question if enabled
        this.shuffledOptions = [];
        for (let i = 0; i < this.questions.length; i++) {
            if (this.shuffleOptionsEnabled) {
                // Create array of indices [0,1,2,3] and shuffle them
                const indices = [0, 1, 2, 3];
                this.shuffledOptions.push(this.shuffleArray(indices));
            } else {
                // Keep original order
                this.shuffledOptions.push([0, 1, 2, 3]);
            }
        }

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.isReviewMode = false;

        this.chapterSelector.style.display = 'none';
        this.quizContainer.style.display = 'block';
        this.resultsContainer.style.display = 'none';

        this.totalQuestions.textContent = this.questions.length;
        this.updateQuestion();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    updateQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        // Update progress
        this.questionNumber.textContent = `Câu ${this.currentQuestionIndex + 1}`;
        this.progressFill.style.width = `${((this.currentQuestionIndex + 1) / this.questions.length) * 100}%`;
        this.scoreDisplay.textContent = this.score;

        // Update question text with status badge in review mode
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        let statusBadge = '';

        if (this.isReviewMode || userAnswer !== null) {
            if (userAnswer === null) {
                statusBadge = '<span class="status-badge status-unanswered">⚪ Chưa trả lời</span>';
            } else if (userAnswer === question.correct) {
                statusBadge = '<span class="status-badge status-correct">✓ Đúng</span>';
            } else {
                statusBadge = '<span class="status-badge status-incorrect">✗ Sai</span>';
            }
        }

        this.questionText.innerHTML = `<strong>${this.currentQuestionIndex + 1}. ${question.question}</strong>${statusBadge}`;

        // Update options with shuffled order if enabled
        this.optionsContainer.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        const optionOrder = this.shuffledOptions[this.currentQuestionIndex] || [0, 1, 2, 3];

        optionOrder.forEach((originalIndex, displayIndex) => {
            const option = question.options[originalIndex];
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';

            const isCorrectAnswer = originalIndex === question.correct;
            const isUserAnswer = userAnswer === originalIndex;

            if (this.isReviewMode || userAnswer !== null) {
                optionDiv.classList.add('disabled');
                if (isCorrectAnswer) {
                    optionDiv.classList.add('correct-answer');
                    if (isUserAnswer) {
                        optionDiv.classList.add('correct');
                    }
                } else if (isUserAnswer) {
                    optionDiv.classList.add('incorrect');
                }
            } else if (isUserAnswer) {
                optionDiv.classList.add('selected');
            }

            optionDiv.innerHTML = `
                <span class="option-letter">${letters[displayIndex]}</span>
                <span class="option-text">${option}</span>
            `;

            if (!this.isReviewMode && userAnswer === null) {
                optionDiv.addEventListener('click', () => this.selectOption(originalIndex));
            }

            this.optionsContainer.appendChild(optionDiv);
        });

        // Show explanation if answered
        if ((this.isReviewMode || this.userAnswers[this.currentQuestionIndex] !== null) && question.explanation) {
            this.explanation.textContent = question.explanation;
            this.explanation.style.display = 'block';
        } else {
            this.explanation.style.display = 'none';
        }

        // Update navigation buttons
        this.prevBtn.disabled = this.currentQuestionIndex === 0;

        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.nextBtn.style.display = 'none';
            if (!this.isReviewMode) {
                this.submitBtn.style.display = 'inline-block';
            } else {
                this.submitBtn.style.display = 'none';
            }
        } else {
            this.nextBtn.style.display = 'inline-block';
            this.submitBtn.style.display = 'none';
        }
    }

    selectOption(index) {
        if (this.userAnswers[this.currentQuestionIndex] !== null) return;

        const question = this.questions[this.currentQuestionIndex];
        this.userAnswers[this.currentQuestionIndex] = index;

        if (index === question.correct) {
            this.score++;
        }

        this.updateQuestion();

        // NO auto advance - user needs to click "Tiếp" button manually
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.updateQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.updateQuestion();
        }
    }

    showResults() {
        this.quizContainer.style.display = 'none';
        this.resultsContainer.style.display = 'block';

        const percentage = Math.round((this.score / this.questions.length) * 100);
        document.getElementById('finalScore').textContent = percentage;
        document.getElementById('correctCount').textContent = this.score;
        document.getElementById('totalCount').textContent = this.questions.length;

        const scoreCircle = document.querySelector('.score-circle');
        if (percentage >= 80) {
            scoreCircle.style.borderColor = '#10b981';
        } else if (percentage >= 50) {
            scoreCircle.style.borderColor = '#f59e0b';
        } else {
            scoreCircle.style.borderColor = '#ef4444';
        }
    }

    reviewAnswers() {
        this.isReviewMode = true;
        this.currentQuestionIndex = 0;
        this.resultsContainer.style.display = 'none';
        this.quizContainer.style.display = 'block';
        this.updateQuestion();
    }

    restartQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.isReviewMode = false;

        // Shuffle again only if enabled
        if (this.shuffleEnabled) {
            this.questions = this.shuffleArray(this.questions);
        }

        this.resultsContainer.style.display = 'none';
        this.quizContainer.style.display = 'block';
        this.updateQuestion();
    }

    backToChapters() {
        this.resultsContainer.style.display = 'none';
        this.quizContainer.style.display = 'none';
        this.chapterSelector.style.display = 'block';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
