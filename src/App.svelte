<script>

  // async function getRecords() {
  //   const app = 914;
  //   const query = 'order by $id desc limit 500';
  //   const data = await kintone.api(kintone.api.url('/k/v1/records'), 'GET', {app, query});
  //   data.records.forEach(val => {
  //     val['レコード番号'].value = Number(val['レコード番号'].value);
  //     if (!val['都道府県'].value) val['都道府県'].value = 'オンライン';
  //   });
  //   return data.records;
  // };

  const fields = ['レコード番号', '日付', 'イベント名', '都道府県'];

  // ++++++++++++++++++++++++++++++
  // GitHub Pages 用に新たに追加した処理
  // 1) 疑似レコードデータはJSONに
  // 2) テーブルのヘッダーをクリックするとソートする
  // ++++++++++++++++++++++++++++++

  import data from '../recordsData.js';
  data.records.forEach(val => {
    val['レコード番号'].value = Number(val['レコード番号'].value);
    if (!val['都道府県'].value) val['都道府県'].value = 'オンライン';
  });

  let recordsData = data.records;

  let sortflag = {
    data: '',
    desc: false
  };

  function sortData(header) {
    // すでにソートがされているかで分岐
    if (sortflag.data !== header) {
      // まだソートしてないフィールドが選ばれたら、降順にする
      recordsData = recordsData.sort((x, y) => x[header].value < y[header].value ? 1 : -1);
      sortflag = {data: header, desc: true, [header]: '↓'};
      return;
    }
    // すでにソートしているフィールドが選ばれたら、現在が昇順/降順どちらか確認してその逆順にする
    const num = sortflag.desc ? -1 : 1; // descがtrueなら昇順、falseなら降順
    recordsData = recordsData.sort((x, y) => x[header].value < y[header].value ? num : num * -1);
    sortflag = {data: header, desc: num === 1, [header]: num === 1 ? '↓' : '↑'};
  };
</script>

<main>
  <div class="container">
    <div class="header"><p>☁ kintone</p></div>
    <div class="header-black"></div>
    <div class="header-image"><p>Svelteで一覧作ってみた</p></div>
    <div class="app-index-bread">🏠 ＞ スペース: 一覧自作 ＞ アプリ：Svelte一覧</div>
    <div class="app-index-toolbar"></div>
  </div>
  {#await recordsData then record}
    <table class="origin-table recordlist-gaia">
      <thead>
        {#each fields as field}
          <th class="origin-th recordlist-header-cell-gaia"on:click={() => sortData(field)}>{field} {sortflag[field] || ''}</th>
        {/each}
      </thead>
      <tbody>
        {#each recordsData as record}
          <tr class="origin-tr recordlist-row-gaia">
            {#each fields as field}
              <td class="origin-td recordlist-cell-gaia">{record[field].value}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/await}
</main>

<style>
.origin-th,
.origin-td {
  padding: 5px 10px;
}
.origin-th {
  height: 45px;
}
.origin-td {
  height: 40px;
  vertical-align: middle;
}

/* ------------ */
/* kintoneのCSS */
/* ------------ */
.recordlist-gaia {
  border-color: #e3e7e8;
  border-collapse: separate;
  width: 100%;
}
.recordlist-header-cell-gaia {
  border-color: #e3e7e8;
  white-space: nowrap;
  border-width: 1px 1px 1px 0;
  border-style: solid;
  text-align: left;
  letter-spacing: .1em;
  font-weight: 400;
  word-wrap: normal;
}
.recordlist-row-gaia {
  background-color: #fff;
}
.recordlist-row-gaia:nth-child(2n+1) {
  background-color: #f5f5f5;
}
.recordlist-cell-gaia {
  border-color: #e3e7e8;
}

/* ---------------------- */
/* 自作kintoneヘッダーのCSS */
/* ---------------------- */
.header {
  width: 100%;
  margin: 0;
  height: 60px;
  background-color: rgb(255, 204, 0);
}
.header p {
  margin: 0;
  font-size: 25px;
  padding-top: 13px;
  padding-left: 15px;
  font-weight: bold;
}
.header-black {
  width: 100%;
  margin: 0;
  height: 40px;
  background-color: #4B4B4B;
}
.header-image {
  width: 100%;
  margin: 0;
  height: 60px;
  background-image: url('https://blob.swri.jp/b4be6341e429bbe6ca51111fb5071bc9.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header-image p {
  color: #fff;
  font-size: 25px;
  margin: 0;
  padding-top: 10px;
  padding-left: 20px;
}
.app-index-bread {
  height: 35px;
  padding: 5px 0 0 0;
  padding-left: 10px;
  font-size: 15px;
  color: #aaa;
  border-bottom: 1px solid #dddddd;
}

.app-index-toolbar {
  height: 100px;
}
</style>