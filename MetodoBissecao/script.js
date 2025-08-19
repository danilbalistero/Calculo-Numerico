document.addEventListener('DOMContentLoaded', () => {

    criarCamposCoeficientes();


    const grauInput = document.getElementById('grau');
    grauInput.addEventListener('input', criarCamposCoeficientes);


    document.getElementById('btn-encontrar')
        .addEventListener('click', encontrarIntervalos);
});


function criarCamposCoeficientes() {
    const grau = parseInt(document.getElementById('grau').value) || 0;
    const container = document.getElementById('coeficientes-container');
    container.innerHTML = '';

    for (let i = grau; i >= 0; i--) {
        const item = document.createElement('div');
        item.className = 'coef-item';

        const label = document.createElement('div');
        label.className = 'coef-label';
        label.textContent = (i === 0 ? 'C' : `x^${i}`) + ':';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'coef-input';
        input.dataset.grau = String(i);
        input.step = '0.1';
        input.value = (i === grau ? 1 : 0);
        input.addEventListener('input', atualizarPolinomio);

        item.appendChild(label);
        item.appendChild(input);
        container.appendChild(item);
    }

    atualizarPolinomio();
}

function getCoeficientes() {
    const inputs = document.querySelectorAll('.coef-input');
    const coefs = {};
    inputs.forEach((input) => {
        coefs[input.dataset.grau] = parseFloat(input.value || '0');
    });
    return coefs;
}

function atualizarPolinomio() {
    const coefs = getCoeficientes();
    const termos = Object.keys(coefs)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map((grauStr) => {
            const grau = parseInt(grauStr);
            const coef = coefs[grauStr];
            if (!isFinite(coef) || coef === 0) return '';

            const sinal = coef < 0 ? ' - ' : ' + ';
            const absCoef = Math.abs(coef);
            const coefStr = absCoef === 1 && grau !== 0 ? '' : absCoef.toString();
            const xStr = grau === 0 ? '' : (grau === 1 ? 'x' : `x^${grau}`);
            return `${sinal}${coefStr}${xStr}`;
        })
        .filter(Boolean);

    let polinomioStr = 'f(x) = ';
    if (termos.length === 0) {
        polinomioStr += '0';
    } else {
        let primeira = termos[0].trim();
        if (primeira.startsWith('+')) primeira = primeira.substring(1).trim();
        polinomioStr += primeira + termos.slice(1).join('');
    }


    document.getElementById('polinomio-display').textContent =
        polinomioStr.replace(/\s\+\s-/g, ' - ');
}


function calcularPolinomio(x, coefs) {
    let resultado = 0;
    for (const [grauStr, coef] of Object.entries(coefs)) {
        const grau = parseInt(grauStr);
        resultado += (coef || 0) * Math.pow(x, grau);
    }
    return resultado;
}

function encontrarIntervalos() {
    const limiteA = parseFloat(document.getElementById('limite-a').value);
    const limiteB = parseFloat(document.getElementById('limite-b').value);
    const coefs = getCoeficientes();

    const intervalosDiv = document.getElementById('intervalos-encontrados');
    const logFinal = document.getElementById('log-final');
    const tabela = document.getElementById('tabela-bisseccao');

    intervalosDiv.innerHTML = '';
    tabela.style.display = 'none';
    document.getElementById('raiz-final').textContent = '';
    logFinal.textContent = 'Buscando intervalos...';


    if (!isFinite(limiteA) || !isFinite(limiteB) || limiteA >= limiteB) {
        intervalosDiv.textContent = 'Defina um intervalo válido (a < b).';
        logFinal.textContent += '\nIntervalo inválido.';
        return;
    }

    const intervalos = [];

    for (let x = limiteA; x < limiteB; x++) {
        const fx = calcularPolinomio(x, coefs);
        const fx1 = calcularPolinomio(x + 1, coefs);
        if (fx === 0) intervalos.push([x, x]);
        if (fx * fx1 < 0) intervalos.push([x, x + 1]);
    }

    if (intervalos.length === 0) {
        intervalosDiv.textContent = 'Nenhum intervalo encontrado.';
        logFinal.textContent += '\nNenhum intervalo válido para o método de Bissecção.';
        return;
    }

    intervalos.forEach(([a, b]) => {
        const btn = document.createElement('button');
        btn.className = 'interval-btn';
        btn.textContent = `[${a}, ${b}]`;
        btn.addEventListener('click', () => calcularBisseccao(a, b));
        intervalosDiv.appendChild(btn);
    });

    logFinal.textContent += `\n${intervalos.length} intervalo(s) encontrado(s). Clique em um deles para calcular a raiz.`;
}

function calcularBisseccao(a, b) {
    const tolerancia = parseFloat(document.getElementById('erro').value);
    const coefs = getCoeficientes();
    const tabela = document.getElementById('tabela-bisseccao');
    const tabelaBody = tabela.querySelector('tbody');
    const logFinal = document.getElementById('log-final');

    tabelaBody.innerHTML = '';
    logFinal.textContent = `Calculando raiz no intervalo [${a}, ${b}]...\n`;

    let fa = calcularPolinomio(a, coefs);
    let fb = calcularPolinomio(b, coefs);


    if (a === b && Math.abs(fa) < (tolerancia || 1e-12)) {
        tabela.style.display = 'table';
        document.getElementById('raiz-final').textContent =
            `Raiz Encontrada: ${a.toFixed(8)} (exata no ponto)`;
        logFinal.textContent += `Raiz exata identificada em x=${a}.`;
        return;
    }

    if (fa * fb >= 0) {
        logFinal.textContent += 'Erro: Intervalo inválido. f(a) e f(b) devem ter sinais opostos.';
        return;
    }

    let iter = 0;
    let m, fm;
    const maxIter = 100;

    while ((b - a) / 2 > tolerancia && iter < maxIter) {
        m = (a + b) / 2;
        fm = calcularPolinomio(m, coefs);

        const row = tabelaBody.insertRow();
        row.innerHTML = `
      <td>${iter + 1}</td>
      <td>${a.toFixed(6)}</td>
      <td>${b.toFixed(6)}</td>
      <td>${m.toFixed(6)}</td>
      <td>${fm.toFixed(6)}</td>
    `;

        if (Math.abs(fm) < tolerancia) break;

        if (fa * fm < 0) {
            b = m;
            fb = fm;
        } else {
            a = m;
            fa = fm;
        }

        iter++;
    }

    const raiz = (a + b) / 2;
    tabela.style.display = 'table';
    document.getElementById('raiz-final').textContent =
        `Raiz Encontrada: ${raiz.toFixed(8)} | Erro: ${((b - a) / 2).toExponential(3)} | Iterações: ${iter + 1}`;
    logFinal.textContent += `Cálculo concluído. Raiz: ${raiz.toFixed(8)}.`;
}