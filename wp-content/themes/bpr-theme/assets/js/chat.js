(() => {
    const app = document.querySelector('.bpr-chat');
    if (!app) return;

    const apiBase = app.dataset.apiBase.replace(/\/$/, '');
    const thread = app.querySelector('[data-thread]');
    const welcome = app.querySelector('[data-welcome]');
    const composer = app.querySelector('[data-composer]');
    const input = app.querySelector('[data-input]');
    const modelSelect = app.querySelector('[data-model]');
    const sendButton = app.querySelector('[data-send]');
    const offer = app.querySelector('[data-offer]');
    const history = [];
    let userMessageCount = 0;
    let guide = 'intuitive';
    let offerDismissed = false;

    const guideNames = {
        intuitive: 'Intuitive guide',
        tarot: 'Tarot lens',
        dreams: 'Dream keeper',
        relationships: 'Heart & connection',
        path: 'Life path',
    };

    function addMessage(role, text, typing = false) {
        const row = document.createElement('article');
        row.className = `bpr-message bpr-message--${role}${typing ? ' bpr-message--typing' : ''}`;
        row.setAttribute('aria-label', role === 'user' ? 'Your message' : 'AI response');

        const avatar = document.createElement('span');
        avatar.className = 'bpr-message__avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = role === 'user' ? '◉' : '✦';

        const body = document.createElement('div');
        body.className = 'bpr-message__body';
        if (typing) {
            body.textContent = 'Thinking';
            const dots = document.createElement('span');
            dots.className = 'bpr-message__dots';
            dots.setAttribute('aria-hidden', 'true');
            for (let i = 0; i < 3; i += 1) dots.append(document.createElement('i'));
            body.append(dots);
            row.setAttribute('aria-label', 'AI is thinking');
        } else {
            body.textContent = text;
        }

        row.append(avatar, body);
        thread.append(row);
        thread.scrollTop = thread.scrollHeight;
        return row;
    }

    function recentMessages() {
        const messages = history.slice(-16);
        while (messages.length && messages[0].role !== 'user') messages.shift();
        const size = () => messages.reduce((total, item) => total + item.content.length, 0);
        while (messages.length > 1 && size() > 12000) messages.splice(0, 2);
        return messages;
    }

    async function loadModels() {
        try {
            const response = await fetch(`${apiBase}/api/models`, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Models are not available');
            const data = await response.json();
            const models = Array.isArray(data.models) ? data.models : [];
            modelSelect.replaceChildren();
            if (!models.length) throw new Error('No free models are currently available');
            models.forEach((model, index) => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name || model.id;
                if (index === 0) option.selected = true;
                modelSelect.append(option);
            });
        } catch {
            modelSelect.replaceChildren(new Option('Chat temporarily unavailable', ''));
            sendButton.disabled = true;
            sendButton.title = 'The chat service is not configured yet.';
        }
    }

    async function sendMessage(message) {
        const text = message.trim();
        if (!text || sendButton.disabled || !modelSelect.value) return;
        if (welcome.isConnected) welcome.remove();

        userMessageCount += 1;
        history.push({ role: 'user', content: text });
        addMessage('user', text);
        input.value = '';
        input.style.height = 'auto';
        sendButton.disabled = true;
        modelSelect.disabled = true;
        const thinking = addMessage('assistant', '', true);

        if (userMessageCount >= 2 && !offerDismissed) offer.hidden = false;

        try {
            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ guide, model: modelSelect.value, messages: recentMessages() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'The chat could not reply right now. Please try again.');
            const reply = typeof data.reply === 'string' ? data.reply.trim() : '';
            if (!reply) throw new Error('The model returned an empty reply. Please try again.');
            thinking.remove();
            history.push({ role: 'assistant', content: reply });
            addMessage('assistant', reply);
        } catch (error) {
            thinking.remove();
            const message = error.message || 'The chat could not reply right now. Please try again.';
            history.push({ role: 'assistant', content: 'The service was temporarily unavailable for the previous message.' });
            addMessage('assistant', message);
        } finally {
            sendButton.disabled = false;
            modelSelect.disabled = false;
            input.focus();
        }
    }

    composer.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            composer.requestSubmit();
        }
    });

    app.querySelectorAll('[data-prompt]').forEach((button) => {
        button.addEventListener('click', () => {
            input.value = button.dataset.prompt;
            composer.requestSubmit();
        });
    });

    app.querySelectorAll('[data-guide]').forEach((button) => {
        button.addEventListener('click', () => {
            guide = button.dataset.guide;
            app.querySelectorAll('[data-guide]').forEach((item) => item.classList.toggle('is-active', item === button));
            app.querySelector('[data-guide-name]').textContent = guideNames[guide];
            app.classList.remove('menu-open');
            app.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false');
        });
    });

    app.querySelector('[data-new-chat]').addEventListener('click', () => window.location.reload());
    app.querySelector('[data-menu-toggle]').addEventListener('click', (event) => {
        const open = app.classList.toggle('menu-open');
        event.currentTarget.setAttribute('aria-expanded', String(open));
    });
    app.querySelector('[data-offer-dismiss]').addEventListener('click', () => {
        offerDismissed = true;
        offer.hidden = true;
    });

    loadModels();
})();
