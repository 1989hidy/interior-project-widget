const { getNotion, getText, getDate, sendError, queryAll } = require("./notion");

module.exports = async (request, response) => {
  try {
    const notion = getNotion();
    const pages = await queryAll(notion, {
      database_id: process.env.NOTION_PROCESS_DATABASE_ID
    });
    const processes = pages.map((page) => {
      const period = getDate(page.properties["시공 기간"]);
      return {
        order: Number(getText(page.properties["순서"])) || 0,
        name: getText(page.properties["공정명"]),
        tag: getText(page.properties["표시태그"]),
        status: getText(page.properties["상태"]),
        startDate: period?.start || null,
        endDate: period?.end || period?.start || null
      };
    });
    // 착공일은 공정관리 DB에 입력된 시공 기간 중 가장 이른 시작일입니다.
    const expectedStartDate = processes
      .filter((process) => process.startDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]?.startDate || null;
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    response.status(200).json({ expectedStartDate, processes });
  } catch (error) { sendError(response, error); }
};
