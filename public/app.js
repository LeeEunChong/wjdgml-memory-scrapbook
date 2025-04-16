document.addEventListener('DOMContentLoaded', () => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const modal = document.getElementById('memoryModal');
    const addMemoryBtn = document.getElementById('addMemoryBtn');
    const closeBtn = document.querySelector('.close');
    const memoryForm = document.getElementById('memoryForm');
    const timelineContainer = document.querySelector('.timeline-container');
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '로그아웃';
    logoutBtn.id = 'logoutBtn';
    document.querySelector('nav').appendChild(logoutBtn);

    // 로그아웃 기능
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    // 모달 열기/닫기
    addMemoryBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 추억 저장
    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('date', document.getElementById('memoryDate').value);
        formData.append('title', document.getElementById('memoryTitle').value);
        formData.append('content', document.getElementById('memoryContent').value);
        
        const mediaFile = document.getElementById('memoryMedia').files[0];
        if (mediaFile) {
            formData.append('media', mediaFile);
        }

        try {
            const response = await fetch('/api/memories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const memory = await response.json();
                addMemoryToTimeline(memory);
                modal.style.display = 'none';
                memoryForm.reset();
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    });

    // 타임라인에 추억 추가
    function addMemoryToTimeline(memory) {
        const memoryCard = document.createElement('div');
        memoryCard.className = 'memory-card';
        
        const date = new Date(memory.date).toLocaleDateString('ko-KR');
        
        memoryCard.innerHTML = `
            <h3>${memory.title}</h3>
            <p class="date">${date}</p>
            <p>${memory.content}</p>
            ${memory.mediaUrl ? `<img src="${memory.mediaUrl}" alt="Memory image">` : ''}
        `;
        
        timelineContainer.appendChild(memoryCard);
    }

    // 기존 추억 불러오기
    async function loadMemories() {
        try {
            const response = await fetch('/api/memories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const memories = await response.json();
                memories.forEach(memory => {
                    addMemoryToTimeline(memory);
                });
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    }

    // 페이지 로드 시 추억 불러오기
    loadMemories();
}); 