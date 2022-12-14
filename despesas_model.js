const Pool = require("pg").Pool;
const pool = new Pool({
  user: "godlove",
  host: "localhost",
  database: "sopdb",
  password: "root",
  port: 5432,
});
const getDespesas = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      'SELECT * FROM public.despesa ORDER BY "numeroProtocolo" DESC',
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getValorEmpenhosDaDespesa = (params) => {
  const { numeroProtocolo } = params;
  return new Promise(function (resolve, reject) {
    pool.query(
      `SELECT SUM ("valorEmpenho") FROM public.empenho WHERE "numeroProtocolo" = ${numeroProtocolo};`,
      (error, results) => {
        if (error) {
          console.log("Não há registros de empenhos para essa despesa.");
          resolve("Não há registros de empenhos para essa despesa.");
          return;
        }
        resolve(results.rows);
      }
    );
  });
};

const getValorPagamentosDaDespesa = (params) => {
  const { numeroProtocolo } = params;
  return new Promise(function (resolve, reject) {
    pool.query(
      `SELECT SUM("valorPagamento") FROM public.pagamento,
      (SELECT "numeroEmpenho" as num 
      FROM public.empenho WHERE "numeroProtocolo" = ${numeroProtocolo}) as n
      WHERE "numeroEmpenho" = "num";`,
      (error, results) => {
        if (error) {
          console.log("Não há registros de pagamentos para essa despesa.");
          resolve("Não há registros de pagamentos para essa despesa.");
          return;
        }
        resolve(results.rows);
      }
    );
  });
};

const getDespesasDataProtocolo = () => {
  return new Promise(function (resolve, reject) {
    pool.query(
      'SELECT * FROM public.despesa ORDER BY "dataProtocolo" ASC',
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getDespesasTipoDespesa = (params) => {
  return new Promise(function (resolve, reject) {
    console.log("Params " + JSON.stringify(params));
    const { tipoDespesa } = params;
    let query = `SELECT * FROM public.despesa WHERE \"tipoDespesa\" LIKE '%${tipoDespesa}%'`;
    console.log(query);

    pool.query(
      `SELECT * FROM public.despesa WHERE \"tipoDespesa\" LIKE '%${tipoDespesa}%'`,
      [],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(results.rows);
      }
    );
  });
};

const getDespesasCredor = (params) => {
  return new Promise(function (resolve, reject) {
    console.log("Params " + JSON.stringify(params));
    const { credor, dataProtocolo } = params;
    let query =
      dataProtocolo !== "" && credor !== undefined && credor !== ""
        ? `SELECT * FROM public.despesa 
        WHERE \"credorDespesa\" LIKE '%${credor}%' 
        OR \"tipoDespesa\" LIKE '%${credor}%'`
        : credor !== undefined && credor !== ""
        ? `SELECT * FROM public.despesa 
      WHERE \"credorDespesa\" LIKE '%${credor}%' 
      OR \"tipoDespesa\" LIKE '%${credor}%'`
        : `SELECT * FROM public.despesa 
      WHERE \"dataProtocolo\" = '${dataProtocolo}'`;
    console.log(query);

    pool.query(
      dataProtocolo !== undefined && credor !== undefined && credor !== ""
        ? `SELECT * FROM (SELECT * FROM public.despesa 
        WHERE "credorDespesa" LIKE '%${credor}%' 
        OR "tipoDespesa" LIKE '%${credor}%') AS n 
        WHERE "dataProtocolo" = '${dataProtocolo}' 
        ORDER BY "numeroProtocolo"`
        : credor !== undefined && credor !== ""
        ? `SELECT * FROM public.despesa 
      WHERE "credorDespesa" LIKE '%${credor}%' 
      OR "tipoDespesa" LIKE '%${credor}%'`
        : `SELECT * FROM public.despesa 
      WHERE "dataProtocolo" = '${dataProtocolo}'`,
      [],
      (error, results) => {
        if (error) {
          resolve(`Erro ao pesquisar ${credor} ${dataProtocolo} ${error}`);
          return;
        }
        resolve(results.rows);
      }
    );
  });
};

const createDespesa = (body) => {
  return new Promise(function (resolve, reject) {
    const { tipoDespesa, credorDespesa, descricaoDespesa, valorDespesa } = body;
    const date = new Date();
    const currentDay =
      date.getFullYear() +
      "-" +
      Number(date.getMonth() + 1) +
      "-" +
      (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
    const vencimento = Number(date.getFullYear() + 10) + "-12-31";
    pool.query(
      `INSERT INTO despesa
        ("tipoDespesa", "dataProtocolo", "dataVencimento", "credorDespesa", "descricaoDespesa", "valorDespesa", "status")
        VALUES ($1, '${currentDay}', '${vencimento}', $2, $3, $4, 'Aguardando empenho') RETURNING *`,
      [tipoDespesa, credorDespesa, descricaoDespesa, valorDespesa],
      (error, results) => {
        if (error) {
          reject(error);
        }
        resolve(`A new despesa has been added added: ${results.rows[0]}`);
      }
    );
  });
};

const deleteDespesa = (params) => {
  const { numeroProtocolo } = params;
  return new Promise(function (resolve, reject) {
    pool.query(
      `DELETE FROM public.despesa WHERE "numeroProtocolo" = ${numeroProtocolo}`,
      [],
      (error, results) => {
        if (error) {
          console.log(
            `Não foi possível excluir a despesa de número ${numeroProtocolo}, pois há empenhos associados a ela.`,
            error
          );
          resolve(
            `Não foi possível excluir a despesa de número ${numeroProtocolo}, pois há empenhos associados a ela.`,
            error
          );
          return;
        }
        console.log(
          `Despesa de número ${numeroProtocolo} excluída com sucesso!`
        );
        resolve(`Despesa de número ${numeroProtocolo} excluída com sucesso!`);
      }
    );
  });
};

module.exports = {
  getDespesas,
  getDespesasTipoDespesa,
  getDespesasDataProtocolo,
  getDespesasCredor,
  getValorEmpenhosDaDespesa,
  getValorPagamentosDaDespesa,
  createDespesa,
  deleteDespesa,
};
