const { getNotion, getDate, sendError } = require("./notion");

module.exports = async (request, response) => {
  try {
    const notion = getNotion();
    const result = await notion.databases.query({ database_id: process.env.NOTION_PROJECT_DATABASE_ID, page_size: 1 });
    const page = result.results[0];
    const date = page && getDate(page.properties["예상 착공일"]);
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    response.status(200).json({ expectedStartDate: date?.start || null });
  } catch (error) { sendError(response, error); }
};
