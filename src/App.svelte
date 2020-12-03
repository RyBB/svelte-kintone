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
</style>