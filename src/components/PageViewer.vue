<template>
  <div class="page-viewer" :id="id" :style="{ left: left + 'px' }">
    <div v-if="width > 70" v-html="pageContent"></div>
    <h1 v-else class="page-title">{{ pageTitle }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, toRefs, onUpdated } from "vue";
import { fetchPageContent } from "../utils";

export default defineComponent({
  name: "PageViewer",
  props: {
    url: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      required: true
    },
    left: {
      type: Number,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    level: {
      type: Number,
      required: true
    }
  },
  setup: (props, { emit }) => {
    const { url, id } = toRefs(props);
    const pageContent = ref();
    const pageTitle = ref("");
    const pageLinks = ref([]);
    const connectedPages = ref([]);

    const clickLink = (url) => {
      emit("click-url", url, props.level);
    };

    const hoverLink = (event, content) => {
      emit("show-tooltip", event, content);
    }

    const leaveLink = () => {
      emit("hide-tooltip");
    }

    onMounted(async () => {
      const mainDoc = await fetchPageContent(url.value);

      const links = mainDoc.links;
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const url = link.getAttribute("href");
        pageLinks.value.push(url);

        const pageDoc = await fetchPageContent(url);
        connectedPages.value.push({
          url,
          content: pageDoc.body.innerHTML
        })
      }

      pageContent.value = mainDoc.body.innerHTML;
      pageTitle.value = mainDoc.head.innerText
          ? mainDoc.head.innerText
          : url.value;
    });

    onUpdated(() => {
      for (const key in pageLinks.value) {
        const el = document.querySelector(
          `div.page-viewer[id=${id.value}] a[href="${pageLinks.value[key]}"]`
        );
        if (el) {
          if (!el.hasAttribute("data-href")) {
            el.setAttribute("data-href", el.getAttribute("href"));
            el.setAttribute("href", "#");
            el.addEventListener("click", () => {
              clickLink(pageLinks.value[key]);
            });
            el.addEventListener("mouseover", (event) => {
              const connectedPage = connectedPages.value.find(item => item.url === pageLinks.value[key]);
              hoverLink(event, connectedPage.content)
            })
            el.addEventListener("mouseleave", () => {
              leaveLink();
            })
          }
        }
      }
    });

    return {
      pageContent,
      pageTitle
    };
  }
});
</script>

<style>
.page-viewer {
  position: absolute;
  box-shadow: 0 -5px 8px 0 rgba(0, 0, 0, 0.2);
  padding: 20px;
  width: 500px;
  height: 100%;
  overflow-y: scroll;
  background: #ffffff;
  box-sizing: border-box;
}

.page-viewer a:hover {
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.8;
}

.page-viewer .page-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  margin-left: -10px;
}
</style>
