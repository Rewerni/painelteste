const firebaseConfig = {
    apiKey: "AIzaSyBoMhyOV54qyPRRMvBif5VdSweMa1BXVeA",
    authDomain: "cer3-f2d30.firebaseapp.com",
    databaseURL: "https://cer3-f2d30-default-rtdb.firebaseio.com",
    projectId: "cer3-f2d30",
    storageBucket: "cer3-f2d30.firebasestorage.app",
    messagingSenderId: "357179911279",
    appId: "1:357179911279:web:003b3fe84b32d8b3f8b19a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let audioAtivo = false;
let ultimoTimestampAnunciado = null;

function mostrarTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = texto;
    }
}

function mostrarTextoEmTodos(seletor, texto) {
    const lista = document.querySelectorAll(seletor);

    for (let i = 0; i < lista.length; i++) {
        lista[i].textContent = texto;
    }
}

function tirarAcentos(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function criarNumero(texto) {
    let numero = 0;

    for (let i = 0; i < texto.length; i++) {
        numero = ((numero << 5) - numero + texto.charCodeAt(i)) >>> 0;
    }

    return numero;
}

function formatarSenha(valor) {
    if (!valor) {
        return "A000";
    }

    let senha = String(valor).trim().toUpperCase();
    let letras = "";
    let numeros = "";

    for (let i = 0; i < senha.length; i++) {
        const caractere = senha[i];

        if (caractere >= "A" && caractere <= "Z") {
            letras += caractere;
        }

        if (caractere >= "0" && caractere <= "9") {
            numeros += caractere;
        }
    }

    if (!letras || !numeros) {
        return senha;
    }

    while (numeros.length < 3) {
        numeros = "0" + numeros;
    }

    if (numeros.length > 3) {
        numeros = numeros.slice(-3);
    }

    return letras[0] + numeros;
}

function formatarNomeExibicao(valor) {
    if (!valor) {
        return "PACIENTE SILVA";
    }

    const primeirosNomes = [
        "FELIPE", "MATEUS", "DANIEL", "GABRIEL", "THIAGO", "LUCAS", "BRUNO", "CAIO",
        "RAFAEL", "VITOR", "MARCOS", "LEONARDO", "MARIANA", "CAMILA", "FERNANDA", "JULIANA",
        "LARISSA", "PATRICIA", "LETICIA", "VANESSA", "AMANDA", "RENATA", "CARLA", "ALINE"
    ];

    const sobrenomes = [
        "SILVA", "SOUZA", "LIMA", "ALMEIDA", "ROCHA", "COSTA", "MARTINS", "GOMES",
        "RIBEIRO", "CARVALHO", "FERREIRA", "MELO", "BARBOSA", "TEIXEIRA", "OLIVEIRA", "MORAIS",
        "AZEVEDO", "NASCIMENTO", "DUARTE", "ARAUJO", "PINHEIRO", "FREITAS", "CUNHA", "BATISTA"
    ];

    const nomeLimpo = tirarAcentos(valor).trim().replace(/\s+/g, " ").toUpperCase();

    if (!nomeLimpo) {
        return "PACIENTE SILVA";
    }

    const numero = criarNumero(nomeLimpo);
    const indiceNome = numero % primeirosNomes.length;
    const indiceSobrenome = Math.floor(numero / primeirosNomes.length) % sobrenomes.length;

    return primeirosNomes[indiceNome] + " " + sobrenomes[indiceSobrenome];
}

function atualizarRelogio() {
    const agora = new Date();
    const timeZone = "America/Fortaleza";

    const hora = new Intl.DateTimeFormat("pt-BR", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(agora);

    const dataCurta = new Intl.DateTimeFormat("pt-BR", {
        timeZone: timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(agora);

    const diaSemana = new Intl.DateTimeFormat("pt-BR", {
        timeZone: timeZone,
        weekday: "long"
    }).format(agora).toUpperCase();

    const dataLonga = new Intl.DateTimeFormat("pt-BR", {
        timeZone: timeZone,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).formatToParts(agora);

    let semana = "";
    let dia = "";
    let mes = "";
    let ano = "";

    for (let i = 0; i < dataLonga.length; i++) {
        const parte = dataLonga[i];

        if (parte.type === "weekday") semana = parte.value;
        if (parte.type === "day") dia = parte.value;
        if (parte.type === "month") mes = parte.value;
        if (parte.type === "year") ano = parte.value;
    }

    const textoRodape = "HOJE É " + semana.toUpperCase() + ", " + dia + " DE " + mes.toUpperCase() + " DE " + ano;

    mostrarTexto("current-time", hora);
    mostrarTexto("sidebar-time", hora);
    mostrarTexto("current-date", dataCurta + " | " + diaSemana);
    mostrarTextoEmTodos(".footer-ticker__date", textoRodape);
}

function ativarAudio() {
    audioAtivo = !audioAtivo;

    const botao = document.getElementById("btn-audio");

    if (botao) {
        if (audioAtivo) {
            botao.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
        } else {
            botao.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
        }
    }

    if (audioAtivo) {
        const fala = new SpeechSynthesisUtterance("Áudio ativado");
        fala.lang = "pt-BR";
        window.speechSynthesis.speak(fala);
    } else {
        window.speechSynthesis.cancel();
    }
}

async function anunciarPaciente(senha, nome, sala, setor) {
    if (!audioAtivo) {
        return;
    }

    const senhaFormatada = formatarSenha(senha);
    const nomeFormatado = formatarNomeExibicao(nome);
    const frase = "Senha: " + senhaFormatada + ", " + nomeFormatado + ". Dirija-se à " + sala + " de " + setor + ".";

    try {
        const beepInicio = new Audio("beep.mp3");
        beepInicio.play();

        await new Promise(function (resolve) {
            setTimeout(resolve, 300);
        });

        const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/1U7hjYhIrPNoAH64muTX", {
            method: "POST",
            headers: {
                "xi-api-key": "sk_b864fffdc83b7482145d07ca968bf61ed1f6554f803f833e",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: frase,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.8,
                    similarity_boost: 1,
                    style: 0.01
                }
            })
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            console.error("Erro ElevenLabs:", response.status, erroTexto);
            return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const voz = new Audio(audioUrl);

        await voz.play();

        await new Promise(function (resolve) {
            voz.onended = resolve;
        });

        const beepFim = new Audio("beep.mp3");
        beepFim.play();
    } catch (erro) {
        console.error("Erro no áudio:", erro);
    }
}

function atualizarPainel(data) {
    const senha = formatarSenha(data.id);
    const nome = formatarNomeExibicao(data.nome);

    mostrarTexto("active-ticket", senha);
    mostrarTexto("active-patient", nome);
    mostrarTexto("active-room", data.sala);
    mostrarTexto("active-specialty", data.depto);

    const senhaElemento = document.getElementById("active-ticket");

    if (senhaElemento) {
        senhaElemento.classList.remove("animar-senha");
        senhaElemento.offsetWidth;
        senhaElemento.classList.add("animar-senha");
    }

    if (data.timestamp !== ultimoTimestampAnunciado) {
        ultimoTimestampAnunciado = data.timestamp || null;
        anunciarPaciente(senha, nome, data.sala, data.depto);
    }
}

function ouvirPainel() {
    db.ref("atual").on("value", function (snapshot) {
        const data = snapshot.val();

        if (data) {
            atualizarPainel(data);
        }
    }, function (erro) {
        console.error("[Firebase] falha ao ler 'atual':", erro);
    });
}

setInterval(atualizarRelogio, 1000);
atualizarRelogio();
ouvirPainel();
