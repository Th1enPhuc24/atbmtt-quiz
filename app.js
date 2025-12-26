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
        this.retakeFromReviewBtn = document.getElementById('retakeFromReviewBtn');
        this.backToResultsBtn = document.getElementById('backToResultsBtn');
        this.shuffleToggle = document.getElementById('shuffleToggle');
        this.shuffleOptionsToggle = document.getElementById('shuffleOptionsToggle');
        this.questionCountInput = document.getElementById('questionCount');
        this.rangeSettings = document.getElementById('rangeSettings');
        this.questionStartInput = document.getElementById('questionStart');
        this.questionEndInput = document.getElementById('questionEnd');
    }

    initEventListeners() {
        // Start quiz button
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuizFromSelection());

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

        // Question count input - show/hide range settings
        if (this.questionCountInput) {
            this.questionCountInput.addEventListener('input', () => {
                const count = parseInt(this.questionCountInput.value);
                if (count > 0) {
                    this.rangeSettings.style.display = 'flex';
                } else {
                    this.rangeSettings.style.display = 'none';
                    // Clear range inputs when hiding
                    this.questionStartInput.value = '';
                    this.questionEndInput.value = '';
                }
            });
        }

        // Results buttons
        document.getElementById('reviewBtn').addEventListener('click', () => this.reviewAnswers());
        document.getElementById('retakeSameBtn').addEventListener('click', () => this.retakeSameQuiz());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartQuiz());
        document.getElementById('backToChaptersBtn').addEventListener('click', () => this.backToChapters());

        // Review mode buttons
        this.retakeFromReviewBtn.addEventListener('click', () => this.retakeSameQuiz());
        this.backToResultsBtn.addEventListener('click', () => this.backToResults());
    }

    startQuizFromSelection() {
        // Get selected chapters
        const selectedChapters = [];
        document.querySelectorAll('input[name="chapter"]:checked').forEach(cb => {
            selectedChapters.push(cb.value);
        });

        if (selectedChapters.length === 0) {
            alert('Vui lòng chọn ít nhất một chương để ôn tập!');
            return;
        }

        // Save config for retake
        this.lastSelectedChapters = [...selectedChapters];

        this.startQuiz(selectedChapters);
    }

    startQuiz(chapters) {
        // chapters is now an array of selected chapter values
        this.questions = [];

        chapters.forEach(ch => {
            if (ch === '1') {
                // Chapter 1 includes chapter 1 and 2
                const ch12 = allQuestions.filter(q => q.chapter === 1 || q.chapter === 2);
                this.questions.push(...ch12);
            } else {
                const chQuestions = allQuestions.filter(q => q.chapter === parseInt(ch));
                this.questions.push(...chQuestions);
            }
        });

        // Remove duplicates (in case user selects overlapping chapters)
        this.questions = [...new Map(this.questions.map(q => [q.question, q])).values()];

        // Store unshuffled questions for range selection
        const originalOrderQuestions = [...this.questions];

        // Get question count and range settings
        const questionCount = this.questionCountInput ? parseInt(this.questionCountInput.value) : 0;
        const questionStart = this.questionStartInput ? parseInt(this.questionStartInput.value) : 0;
        const questionEnd = this.questionEndInput ? parseInt(this.questionEndInput.value) : 0;

        this.lastQuestionCount = questionCount; // Save for retake

        // Handle range selection if user specified a question count
        if (questionCount > 0) {
            if (questionStart > 0 && questionEnd > 0) {
                // User specified a range
                if (questionStart > questionEnd) {
                    alert('⚠️ Câu hỏi bắt đầu phải nhỏ hơn hoặc bằng câu hỏi kết thúc!');
                    return;
                }

                const rangeCount = questionEnd - questionStart + 1;
                if (rangeCount !== questionCount) {
                    alert(`⚠️ Số câu hỏi trong khoảng (${rangeCount} câu) không khớp với số câu hỏi đã chọn (${questionCount} câu)!\n\nVui lòng điều chỉnh lại.`);
                    return;
                }

                if (questionEnd > originalOrderQuestions.length) {
                    alert(`⚠️ Câu hỏi kết thúc (${questionEnd}) vượt quá tổng số câu hỏi (${originalOrderQuestions.length})!`);
                    return;
                }

                // Use questions from the specified range (1-indexed to 0-indexed)
                this.questions = originalOrderQuestions.slice(questionStart - 1, questionEnd);
            } else if (questionStart > 0 || questionEnd > 0) {
                // Only one field filled
                alert('⚠️ Vui lòng nhập cả câu hỏi bắt đầu và kết thúc, hoặc để trống cả hai để chọn ngẫu nhiên!');
                return;
            } else {
                // No range specified - shuffle and pick random questions
                if (this.shuffleEnabled) {
                    this.questions = this.shuffleArray(this.questions);
                }
                if (questionCount < this.questions.length) {
                    this.questions = this.questions.slice(0, questionCount);
                }
            }
        } else {
            // No question limit - just shuffle if enabled
            if (this.shuffleEnabled) {
                this.questions = this.shuffleArray(this.questions);
            }
        }

        // Save original questions for retake
        this.originalQuestions = [...this.questions];

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

        // Hide review mode buttons by default
        this.retakeFromReviewBtn.style.display = 'none';
        this.backToResultsBtn.style.display = 'none';

        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.nextBtn.style.display = 'none';
            if (!this.isReviewMode) {
                this.submitBtn.style.display = 'inline-block';
            } else {
                this.submitBtn.style.display = 'none';
                // Show retake and back to results buttons on last question in review mode
                this.retakeFromReviewBtn.style.display = 'inline-block';
                this.backToResultsBtn.style.display = 'inline-block';
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

    retakeSameQuiz() {
        // Retake with the same questions and settings (but re-shuffled if shuffle is on)
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.isReviewMode = false;

        // Use the same questions but optionally re-shuffle
        if (this.shuffleEnabled && this.originalQuestions) {
            this.questions = this.shuffleArray([...this.originalQuestions]);
            // Re-limit if there was a count limit
            if (this.lastQuestionCount > 0 && this.lastQuestionCount < this.questions.length) {
                this.questions = this.questions.slice(0, this.lastQuestionCount);
            }
        }

        // Re-shuffle options if enabled
        this.shuffledOptions = [];
        for (let i = 0; i < this.questions.length; i++) {
            if (this.shuffleOptionsEnabled) {
                const indices = [0, 1, 2, 3];
                this.shuffledOptions.push(this.shuffleArray(indices));
            } else {
                this.shuffledOptions.push([0, 1, 2, 3]);
            }
        }

        this.userAnswers = new Array(this.questions.length).fill(null);
        this.totalQuestions.textContent = this.questions.length;

        this.resultsContainer.style.display = 'none';
        this.quizContainer.style.display = 'block';
        this.updateQuestion();
    }

    restartQuiz() {
        // Go back to chapter selection and start fresh
        this.backToChapters();
    }

    backToResults() {
        // Go back to results screen from review mode
        this.isReviewMode = false;
        this.quizContainer.style.display = 'none';
        this.resultsContainer.style.display = 'block';
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
