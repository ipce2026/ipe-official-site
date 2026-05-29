/* Shared rendering for course pages. */
(function () {
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatQuestion(content) {
        const firstOptionMatch = content.match(/\s+([A]\.|\([A]\))/);
        if (!firstOptionMatch) {
            return escapeHtml(content);
        }

        const qText = content.substring(0, firstOptionMatch.index);
        let optsText = content.substring(firstOptionMatch.index);

        optsText = optsText.replace(/\s+([A-D]\.|\([A-D]\))/g, '</span></div><div class="qna-opt"><span class="opt-badge">$1</span><span class="opt-text">');
        optsText = optsText.replace(/^<\/span><\/div>/, '') + '</span></div>';

        return '<div class="qna-q">' + escapeHtml(qText) + '</div><div class="qna-opts">' + optsText + '</div>';
    }

    function renderQna(courseId) {
        const container = document.getElementById('qna-container');
        if (!container) return;

        const rawText = window.IPE_COURSE_QNA && window.IPE_COURSE_QNA[courseId];
        if (!rawText) {
            container.innerHTML = '<p class="qna-desc">目前找不到這個課程的題庫資料。</p>';
            return;
        }

        const items = rawText.trim().split('\n').map((line) => line.trim()).filter(Boolean);
        container.innerHTML = items.map((line) => {
            const match = line.match(/^(\d+)\(([A-D])\)\s*(.*)$/);
            if (!match) return '';

            return '\n            <div class="qna-item">\n                <div class="qna-header">\n                    <span class="qna-num">第 ' + match[1] + ' 題</span>\n                    <span class="qna-ans">解答: ' + match[2] + '</span>\n                </div>\n                <div class="qna-body">' + formatQuestion(match[3]) + '</div>\n            </div>';
        }).join('');
    }

    function setupPrintButton() {
        const button = document.querySelector('.print-pdf-btn');
        const openPrintableQna = () => {
            const qnaDetails = document.querySelector('.qna-details');
            if (qnaDetails) qnaDetails.open = true;
        };

        window.addEventListener('beforeprint', openPrintableQna);
        if (!button) return;

        button.addEventListener('click', () => {
            openPrintableQna();
            window.print();
        });
    }

    function setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const main = document.querySelector('[data-course-id]');
        renderQna(main ? main.dataset.courseId : '');
        setupPrintButton();
        setupBackToTop();
    });
}());
