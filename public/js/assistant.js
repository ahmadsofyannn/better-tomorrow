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

    // 2. Tampilkan pesan indikator loading (typing status) dengan HTML spinner
    const loadingId = appendMessage(
      '<i class="fa-solid fa-spinner fa-spin"></i> Better Tomorrow AI sedang mengetik...',
      'bot',
      true // Tandai sebagai HTML
    );

    try {
      // 3. Panggil API Backend Express (/api/chat)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // 4. Perbarui pesan bot dengan balasan dari server
      const loadingBubble = document.querySelector(`#${loadingId} .msg-bubble`);
      if (loadingBubble) {
        if (response.ok && data.reply) {
          // Format sederhana: ganti \n dengan <br> dan format teks cetak tebal (**teks**)
          let formattedReply = escapeHTML(data.reply)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
          loadingBubble.innerHTML = formattedReply;
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
    } finally {
      // Auto-scroll ke paling bawah setelah respon diterima
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Fungsi helper appendMessage yang aman dari XSS
  function appendMessage(text, sender, isHTML = false) {
    const msgDiv = document.createElement('article');
    const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    msgDiv.id = msgId;
    msgDiv.classList.add('message', `${sender}-message`);

    const avatarIcon = sender === 'bot' ? 'fa-robot' : 'fa-user';
    
    // Tentukan elemen isi bubble (apakah HTML murni atau Text biasa)
    const bubbleContent = isHTML ? text : escapeHTML(text);

    msgDiv.innerHTML = `
      <div class="avatar" aria-hidden="true"><i class="fa-solid ${avatarIcon}"></i></div>
      <div class="msg-bubble">${bubbleContent}</div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
  }

  // Fungsi Sanitisasi HTML agar aman dari injection
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});