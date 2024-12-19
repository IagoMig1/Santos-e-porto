import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkCqYRCBM4OgRgEh6T7RYlLwL3G5lhrRQ",
    authDomain: "santos-e-porto-social.firebaseapp.com",
    projectId: "santos-e-porto-social",
    storageBucket: "santos-e-porto-social.appspot.com",
    messagingSenderId: "292828707092",
    appId: "1:292828707092:web:7d0c3481e9c28fdb63b128"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Função para salvar o login globalmente
function setGlobalLogin(email) {
    // Salvar o email no Firebase Authentication, LocalStorage e Cookie
    localStorage.setItem('email', email);
    document.cookie = `globalEmail=${email}; path=/; max-age=${60 * 60 * 24 * 365}`; // Cookie com 1 ano de validade
}

// Função para registrar um novo usuário
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setGlobalLogin(user.email);
    } catch (error) {
        console.error("Erro ao registrar: ", error);
    }
}

// Função para fazer login de um usuário
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setGlobalLogin(user.email);
    } catch (error) {
        console.error("Erro ao fazer login: ", error);
    }
}

// Função para adicionar um novo post no Firestore
document.getElementById('postForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const content = document.getElementById('postContent').value;
    const profilePic = localStorage.getItem('profilePic') || 'https://via.placeholder.com/50';
    const savedEmail = localStorage.getItem('email');
    const name = savedEmail ? savedEmail.split('@')[0] : null;
    const imageFile = document.getElementById('postImage').files[0];
    const image = imageFile ? URL.createObjectURL(imageFile) : null;

    if (!savedEmail) {
        alert('Para fazer login, clique aqui');
        return;
    }

    if (!content.trim()) {
        alert('O conteúdo do post não pode estar vazio!');
        return;
    }

    const postDate = new Date();
    const newPost = { name, content, profilePic, image, date: postDate };

    // Adiciona o post no Firestore
    try {
        const postsCollection = collection(db, "posts");
        await addDoc(postsCollection, newPost);
        loadPosts(); // Carrega os posts novamente após salvar
    } catch (e) {
        console.error("Erro ao adicionar o post: ", e);
    }

    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';

    const postModal = new bootstrap.Modal(document.getElementById('postModal'));
    postModal.hide();
});

// Função para carregar os posts do Firestore
async function loadPosts() {
    const feed = document.getElementById('feed');
    if (!feed) return;

    feed.innerHTML = '';

    try {
        const postsCollection = collection(db, "posts");
        const querySnapshot = await getDocs(postsCollection);
        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
            postElement.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="post-info">
                            <img src="${post.profilePic}" alt="Foto de perfil" class="profile-pic">
                            <div>
                                <h5>${post.name}</h5>
                                <p class="post-content">${post.content}</p>
                                <p class="post-date">Postado ${formatTime(post.date)} atrás</p>
                            </div>
                        </div>
                        ${post.image ? `<img src="${post.image}" class="post-image img-fluid" alt="Imagem do post">` : ''}
                        <button class="delete-btn btn btn-sm btn-danger" onclick="deletePost('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            feed.appendChild(postElement);
        });
    } catch (e) {
        console.error("Erro ao carregar os posts: ", e);
    }
}

// Função para formatar o tempo de postagem
function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dias`;
    if (hours > 0) return `${hours} horas`;
    if (minutes > 0) return `${minutes} minutos`;
    return `${seconds} segundos`;
}

// Função para deletar um post
async function deletePost(postId) {
    try {
        const postRef = doc(db, "posts", postId);
        await deleteDoc(postRef);
        loadPosts();
    } catch (e) {
        console.error("Erro ao deletar o post: ", e);
    }
}

// Função para salvar a foto de perfil
document.getElementById('accountForm')?.addEventListener('submit', function (event) {
    event.preventDefault();

    const profilePicInput = document.getElementById('profilePicInput').files[0];
    if (profilePicInput) {
        const reader = new FileReader();
        reader.onload = function () {
            localStorage.setItem('profilePic', reader.result);
            loadProfilePic();
        };
        reader.readAsDataURL(profilePicInput);
    }

    const accountModal = new bootstrap.Modal(document.getElementById('accountModal'));
    accountModal.hide();
});

// Função para carregar a foto de perfil
function loadProfilePic() {
    const profilePic = localStorage.getItem('profilePic') || 'https://via.placeholder.com/50';
    const profilePicElements = document.querySelectorAll('.profile-pic');
    profilePicElements.forEach(img => (img.src = profilePic));
}

// Recuperar login global
async function getGlobalLogin() {
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) return savedEmail;

    const cookies = document.cookie.split('; ').find(row => row.startsWith('globalEmail='));
    return cookies ? cookies.split('=')[1] : null;
}

// Verificar o login ao carregar a página
window.onload = function () {
    const currentPage = window.location.pathname.split('/').pop();
    const savedEmail = localStorage.getItem('email');

    // Se o usuário estiver logado e tentar acessar o login, redireciona para o dashboard
    if (savedEmail && currentPage === 'index.html') {
        window.location.href = 'dashboard.html'; // Redireciona para o dashboard
    }

    // Se o usuário não estiver logado e tentar acessar o dashboard, redireciona para o login
    if (!savedEmail && currentPage === 'dashboard.html') {
        window.location.href = 'index.html'; // Redireciona para o login
    }

    // Carregar posts e foto de perfil ao carregar a página
    if (currentPage === 'dashboard.html') {
        loadPosts();
        loadProfilePic();
    }
};
