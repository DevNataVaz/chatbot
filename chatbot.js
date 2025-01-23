// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});
// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});
// apos isso ele diz que foi tudo certo
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
// E inicializa tudo 
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função que usamos para criar o delay entre uma ação e outra

const pendingResponses = new Map(); // Armazena os usuários pendentes de resposta

client.on('message', async msg => {

    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await delay(1000); //delay de 1 segundo
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); //Delay de 1000 milissegundos
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(msg.from, 
            'Olá! ' + name.split(" ")[0] + 
            ' Seja bem-vindo à maior concessionária online do Brasil,\n' + 
            '*Líder auto Veículos*.\n' + 
            'Somos de Brasília. Meu nome é *Caio Dourado*, sou Representante Comercial e vou te atender.\n' + 
            'Seu interesse em adquirir o veículo seria *a vista* ou *financiado*?'
        );
        

        // Configura um timeout para reenviar a mensagem após 30 segundos
        if (!pendingResponses.has(msg.from)) {
            pendingResponses.set(msg.from, setTimeout(async () => {
                await client.sendMessage(msg.from, 'Tudo bem? Seu interesse em adquirir o veículo seria *a vista* ou *financiado*?');
                pendingResponses.delete(msg.from);
            }, 600000)); // 10 minutos
        }
    }

    const vistaPattern = /^(avista|a vista|a-vista|avsta|avista!|à vista)$/i;
    const financiadoPattern = /^(financiado|financiamento|finan|finan\.)$/i;

    if (msg.body && (msg.body.match(vistaPattern) || msg.body.match(financiadoPattern)) && msg.from.endsWith('@c.us')) {
        if (pendingResponses.has(msg.from)) {
            clearTimeout(pendingResponses.get(msg.from));
            pendingResponses.delete(msg.from);
        }

        const chat = await msg.getChat();
        await delay(1000); //delay de 1 segundo
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);

        if (msg.body.match(vistaPattern)) {
            await client.sendMessage(msg.from, 'Ótimo! Vamos prosseguir com as informações para pagamento à vista. Por favor, entre em contato conosco para mais detalhes.');
        } else if (msg.body.match(financiadoPattern)) {
            await client.sendMessage(msg.from, 'Nosso financiamento é bancário, e pode ser feito em até 60 vezes. Independente de score ou renda.\nPara fazer o financiamento preciso que me responda essa pergunta:\n\n- Tem o nome limpo? \n- Qual o valor você tem disponivel para investir no seu financiamento?');
        }
    }
});
