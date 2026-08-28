const { getNotion, getText, getDate, sendError, queryAll } = require("./notion");

module.exports = async (request, response) => {
  try {
    const notion = getNotion();
    const pages = await queryAll(notion, {
      database_id: process.env.NOTION_PROCESS_DATABASE_ID,
      sorts: [{ property: "순서", direction: "ascending" }]
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
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    response.status(200).json({ processes });
  } catch (error) { sendError(response, error); }
};
