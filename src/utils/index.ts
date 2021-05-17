export const fetchPageContent = async (url: string): Promise<Document> => {
  return fetch(`/${url}`)
    .then((res) => res.text())
    .then((html) => {
      const parser = new DOMParser();
      return parser.parseFromString(html, "text/html");
    });
};
