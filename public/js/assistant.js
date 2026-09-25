document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chipBtns = document.querySelectorAll('.chip-btn');

  // Klik chip saran pertanyaan
  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      if (query) {
        handleSendMessage(query);
      }
    });
  });

  // Submit via form
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userMsg = chatInput.value.trim();
      if (!userMsg) return;
      handleSendMessage(userMsg);
    });
  }

  async function handleSendMessage(message) {
    // 1. Tampilkan pesan pengguna di antarmuka
    appendMessage(message, 'user');
    chatInput.value = '';

    // 2. Tampilkan pesan indikator loading (typing status)
    const loadingId = appendMessage('<i class="fa-solid fa-spinner fa-spin"></i> Better Tomorrow AI sedang mengetik...', 'bot');

    try {
      // 3. Panggil API Backend Express (/api/chat) yang terintegrasi dengan Gemini AI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // 4. Perbarui pesan bot dengan balasan asli dari Gemini AI
      const loadingBubble = document.querySelector(`#${loadingId} .msg-bubble`);
      if (loadingBubble) {
        if (response.ok && data.reply) {
          // Mengubah tanda baris baru (\n) menjadi <br> agar format teks rapi
          loadingBubble.innerHTML = data.reply.replace(/\n/g, '<br>');
        } else {
          loadingBubble.innerText = data.error || 'Maaf, gagal mendapatkan respons dari server.';
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const loadingBubble = document.querySelector(`#${loadingId} .msg-bubble`);
      if (loadingBubble) {
        loadingBubble.innerText = 'Terjadi kesalahan koneksi ke server. Pastikan backend berjalan!';
      }
    }
  }

  function appendMessage(text, sender) {
    const msgDiv = document.createElement('article');
    const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    msgDiv.id = msgId;
    msgDiv.classList.add('message', `${sender}-message`);

    const avatarIcon = sender === 'bot' ? 'fa-robot' : 'fa-user';
    msgDiv.innerHTML = `
      <div class="avatar" aria-hidden="true"><i class="fa-solid ${avatarIcon}"></i></div>
      <div class="msg-bubble">${text}</div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
  }
});