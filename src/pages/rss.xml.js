import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const issues = (await getCollection("posts")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: "NoiseFloor",
    description: "A weekly intelligence wire on AI.",
    site: context.site,
    items: issues.map((issue) => ({
      title: issue.data.title,
      pubDate: issue.data.date,
      description: issue.data.summary,
      link: `/posts/${issue.id}/`,
    })),
  });
}
