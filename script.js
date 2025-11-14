// Initialize Vue app
const d = new Date();
new Vue({
  el: "#app",
  data: {
    tab: 0,
    config: {
      precoRifa: 5,
      numerosDisponiveis: 1,
      templateMensagem: "",
    },

    form: {
      nome: "",
      tel: "",
      qtd: 1,
      data: new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0],
      responsavel: "",
    },
    responsaveis: [
      "Beatriz",
      "Bruna",
      "Camily",
      "Dom",
      "Gabo",
      "Isabella",
      "Leonardo",
      "Nanna",
      "Nicole",
      "Pedro",
      "Roberto",
      "Sabrina",
      "Instagram",
    ],
    numeros: [
      //   {
      //     nome: "Vítor Rodrigues",
      //     tel: "11989835636",
      //     data: "14/12",
      //     responsavel: "Beatriz",
      //   },
    ],
    alert: {
      show: false,
      type: "warn",
      content: "aaa",
      timeoutId: null,
    },
  },
  created() {
    const config = localStorage.getItem("config");
    const numeros = localStorage.getItem("numeros");
    if (config) {
      this.config = JSON.parse(config);
    }
    if (numeros) {
      this.numeros = JSON.parse(numeros);
    }
  },

  watch: {
    config: {
      handler(val) {
        localStorage.setItem("config", JSON.stringify(val));
      },
      deep: true,
    },
    numeros: {
      handler(val) {
        localStorage.setItem("numeros", JSON.stringify(val));
      },
      deep: true,
    },
  },

  computed: {
    vendasPorResponsavel() {
      return this.numeros.reduce(
        (acc, x) => {
          if (x.responsavel) {
            acc[x.responsavel]++;
          }
          return acc;
        },
        {
          Beatriz: 0,
          Bruna: 0,
          Camily: 0,
          Dom: 0,
          Gabo: 0,
          Isabella: 0,
          Leonardo: 0,
          Nanna: 0,
          Nicole: 0,
          Pedro: 0,
          Roberto: 0,
          Sabrina: 0,
          Instagram: 0,
        }
      );
    },
    totalVendido() {
      return this.numeros
        .reduce((acc, x) => {
          if (x.responsavel) {
            acc += this.config.precoRifa;
          }
          return acc;
        }, 0)
        .toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
    },
  },

  beforeDestroy() {},

  methods: {
    setTab(n) {
      this.tab = n;
    },

    showAlert(type, content) {
      this.alert.show = true;
      this.alert.type = type;
      this.alert.content = content;
      this.hideAlert();
    },

    hideAlert() {
      clearTimeout(this.alert.timeoutId);
      this.alert.timeoutId = setTimeout(() => {
        this.alert.show = false;
      }, 3000);
    },

    handleBackupFile(e) {
      const backup = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          const json = XLSX.utils.sheet_to_json(sheet, {
            header: ["nome", "tel", "data", "responsavel"],
            range: 0,
            defval: "",
            blankrows: true,
          });
          json.forEach((n) => {
            if (n.data) {
              n.data = excelDateToJSDate(n.data);
            }
          });
          this.numeros.splice(0, this.numeros.length, ...json);
          this.showAlert("success", "backup recuperado");
        } catch (e) {
          console.log(e);
          this.showAlert(
            "error",
            "erro no arquivo de backup. favor contatar o Vítor"
          );
        }
      };

      reader.readAsArrayBuffer(backup);
    },

    exportaExcel() {
      const worksheet = XLSX.utils.aoa_to_sheet(
        this.numeros.map((obj) => [
          obj.nome,
          obj.tel,
          obj.data ? jsDateToExcel(obj.data) : "",
          obj.responsavel,
        ])
      );
      const ts = new Date().toISOString().replace(/[:.]/g, "-");

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      XLSX.writeFile(workbook, `backup-${ts}.xlsx`);
    },

    copiarMensagemZap(nome) {
      if (!this.config.templateMensagem) {
        return this.showAlert(
          "warn",
          "não tem template de mensagem configurado"
        );
      }
      const numeros = this.numeros
        .map((x, i) => {
          if (nome === x?.nome) {
            return i + 1;
          }
        })
        .filter((x) => x)
        .join(",");
      navigator.clipboard.writeText(
        this.config.templateMensagem
          .replaceAll("$NUMERO", numeros)
          .replaceAll("$NOME", nome.split(" ")[0])
      );
    },

    adicionarNaRifa() {
      const novosNumeros = parseInt(this.config.numerosDisponiveis);

      if (isNaN(novosNumeros)) {
        return this.showAlert("error", "número inválido");
      }

      for (let i = 0; i < novosNumeros; i++) {
        this.numeros.push({
          nome: "",
          tel: "",
          data: "",
          responsavel: "",
        });
      }
      this.showAlert("success", "adicionado com sucesso uhuuu");
      this.config.numerosDisponiveis = 1;
    },

    registraVenda() {
      const quantidadeNumeros = parseInt(this.form.qtd);

      const checkForm =
        !this.form.nome ||
        !this.form.tel ||
        !quantidadeNumeros ||
        isNaN(quantidadeNumeros) ||
        !this.form.data ||
        !this.form.responsavel;
      if (checkForm) {
        return this.showAlert("error", "preenche direito bia");
      }

      const numerosDisponiveis = this.numeros
        .map((n, i) => {
          if (!n.nome) {
            return i;
          }
          return NaN;
        })
        .filter((x) => !isNaN(x));

      if (numerosDisponiveis.length < quantidadeNumeros) {
        return this.showAlert("error", "uepa, tá faltando número disponível");
      }

      const numerosSorteados = [];
      for (let i = 0; i < quantidadeNumeros; i++) {
        let index = randInt(0, numerosDisponiveis.length - 1);
        numerosSorteados.push(numerosDisponiveis[index]);
        numerosDisponiveis.splice(index, 1);
      }

      numerosSorteados.forEach((sorteado) => {
        this.numeros[sorteado].nome = this.form.nome;
        this.numeros[sorteado].tel = this.form.tel;
        this.numeros[sorteado].data = this.form.data;
        this.numeros[sorteado].responsavel = this.form.responsavel;
      });
      this.showAlert("success", `sorteado e registrado uhuuuu. A mensagem do whatsapp está no seu ctrl+c`);
      this.copiarMensagemZap(this.form.nome);
      this.form.nome = "";
      this.form.tel = "";
      this.form.qtd = 1;
      this.form.data = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      this.form.responsavel = "";

    },
  },
});

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  return date_info.toISOString().split("T")[0]; // → "2025-01-01"
}

function jsDateToExcel(dateString) {
  const date = new Date(dateString); // JS Date
  return (date - new Date(Date.UTC(1899, 11, 30))) / 86400000;
}
