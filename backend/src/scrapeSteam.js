import * as cheerio from "cheerio";
import axios from "axios";

export async function getTopSteamGames(limit = 2000) {
  const perPage = 50;
  const pages = Math.ceil(limit / perPage);
  const appids = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://store.steampowered.com/search/?filter=topsellers&page=${page}&l=english`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);
    $("a.search_result_row").each((_, el) => {
      const appid = $(el).attr("data-ds-appid");
      if (appid) appids.push(appid);
    });
  }
  return appids.slice(0, limit);
}

export async function getGameInfo(appid) {
  try {
    const { data } = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appid}`
    );
    const game = data[appid];
    if (!game?.success) return null;
    const info = game.data;
    const reqs = info.pc_requirements?.minimum ?? "";
    const clean = reqs.replace(/<[^>]*>/g, "");
    return { appid, name: info.name, reqs: clean };
  } catch {
    return null;
  }
}
