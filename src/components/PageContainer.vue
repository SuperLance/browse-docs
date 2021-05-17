<template>
  <div class="scrollable-pane" @scroll="handleScroll">
    <div class="content" :style="{ width: pages.length * PAGE_WIDTH + 'px' }"></div>
  </div>
  <div class="page-container">
    <PageViewer
      v-for="(page, index) in pages"
      :key="page.url"
      :url="page.url"
      :width="page.width"
      :left="page.left"
      :level="page.level"
      :id="'page-viewer' + index"
      @click-url="handleClickUrl"
      @show-tooltip="showToolTip"
      @hide-tooltip="hideToolTip"
    />
  </div>
  <div  v-if="visibleTooltip"
        class="tooltip-container"
        v-html="tooltipContent"
        :style="{ left: tooltipPosition.left + 'px', top: tooltipPosition.top + 'px' }"
  ></div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import PageViewer from "./PageViewer.vue";
import { PAGE_INFO } from "../resources/constants";
import { Page } from "../resources/interface";

let timer: number | null | undefined = null;

export default defineComponent({
  name: "PageContainer",
  components: { PageViewer },
  setup: () => {
    const pages = ref([
      {
        url: "index.html",
        width: PAGE_INFO.WIDTH,
        left: 0,
        level: 0,
      }
    ]);
    const PAGE_WIDTH = ref(PAGE_INFO.WIDTH);
    const visibleTooltip = ref(false);
    const tooltipContent = ref("");
    const tooltipPosition = ref({ top: 500, left: 500 });

    const showToolTip = (event, content) => {
      const TOOLTIP_WIDTH = 500;
      const TOOLTIP_HEIGHT = 500;

      visibleTooltip.value = true;
      tooltipContent.value = content;

      let posX = event.clientX + 20;
      let posY = event.clientY + 20;
      if (posX + TOOLTIP_WIDTH > window.innerWidth) {
        posX = window.innerWidth - TOOLTIP_WIDTH;
      }
      if (posY + TOOLTIP_HEIGHT > window.innerHeight) {
        posY = window.innerHeight - TOOLTIP_HEIGHT;
      }

      tooltipPosition.value = {
        top: posY,
        left: posX
      };
    };

    const hideToolTip = () => {
      visibleTooltip.value = false;
      tooltipContent.value = "";
    };

    const handleClickUrl = (url: string, level: number) => {
      if (!pages.value.find(item => item.url === url && item.level <= level + 1)) {
        const updatedPages: Page[] = pages.value.filter((item) => item.level <= level);
        if (!updatedPages.find((item) => item.url === url)) {
          updatedPages.push({
            url,
            width: PAGE_INFO.WIDTH,
            left: 0,
            level: level + 1,
          });
        }
        pages.value = updatedPages;
      }

      const scrollPane = document.querySelector(".scrollable-pane");
      const scrollContent = document.querySelector('.scrollable-pane .content');
      scrollContent.style.width = `${pages.value.length * PAGE_INFO.WIDTH}px`;

      const page = pages.value.find(item => item.url === url);
      // smooth scroll
      const targetLeft = Math.max(Math.min(page.level * PAGE_INFO.WIDTH, pages.value.length * PAGE_INFO.WIDTH - window.innerWidth), 0);

      if (timer) clearInterval(timer);

      timer = setInterval(() => {
        const diff = targetLeft - scrollPane.scrollLeft;
        if (Math.abs(diff) < 50) {
          scrollPane.scrollLeft = targetLeft;
          clearInterval(timer);
          timer = null;
        } else {
          scrollPane.scrollLeft += diff > 0 ? 50 : -50;
        }
        handleScroll();
      }, 20);
    };

    const handleScroll = () => {
      const pageInfos = [...pages.value];

      const scrollPane = document.querySelector(".scrollable-pane");
      const scrollLeft = scrollPane.scrollLeft;
      const windowWidth = window.innerWidth;
      const entireWidth = PAGE_INFO.WIDTH * pageInfos.length;
      const scrollRight = entireWidth - windowWidth - scrollLeft;

      let screenLeftWidth = windowWidth;
      let leftPageCnt = pageInfos.length;
      // we need to calculate page width from right
      if (scrollRight >= 0) {
        // right section page count
        const rightFoldPagesCnt = Math.floor(scrollRight / PAGE_INFO.WIDTH);
        // possible right section width
        let rightSectionWidth = (rightFoldPagesCnt + 1) * PAGE_INFO.WIDTH - scrollRight;

        for (let i = 0; i < rightFoldPagesCnt; i++) {
          const page = pageInfos[pageInfos.length - 1 - i];
          page.width = PAGE_INFO.FOLD_WIDTH;
          rightSectionWidth -= page.width;
          screenLeftWidth -= page.width;
        }

        if (rightSectionWidth < PAGE_INFO.FOLD_WIDTH) {
          pageInfos[pageInfos.length - 1 - rightFoldPagesCnt].width = PAGE_INFO.FOLD_WIDTH;
          rightSectionWidth -= PAGE_INFO.FOLD_WIDTH;
          screenLeftWidth -= PAGE_INFO.FOLD_WIDTH;
        } else {
          pageInfos[pageInfos.length - 1 - rightFoldPagesCnt].width = rightSectionWidth;
          screenLeftWidth -= rightSectionWidth;
          rightSectionWidth = 0;
        }

        pageInfos[pageInfos.length - 1 - rightFoldPagesCnt - 1].width = PAGE_INFO.WIDTH + rightSectionWidth;
        screenLeftWidth -= (PAGE_INFO.WIDTH + rightSectionWidth);

        leftPageCnt = pageInfos.length - rightFoldPagesCnt - 2;
      }

      // calculate main screens' page width
      for (let i = leftPageCnt - 1; i >= 0; i--) {
        const page = pageInfos[i];
        page.width = Math.max(PAGE_INFO.FOLD_WIDTH, Math.min(PAGE_INFO.WIDTH, screenLeftWidth - i * PAGE_INFO.FOLD_WIDTH));
        screenLeftWidth -= page.width;
      }

      // determine pages' position
      for (let i = 0; i < pageInfos.length; i++) {
        const page = pageInfos[i];
        if (i === 0) {
          page.left = 0;
        } else {
          page.left = pageInfos[i - 1].left + pageInfos[i - 1].width;
        }
      }

      pages.value = pageInfos;
    };

    onMounted(() => {
      handleScroll();
    });

    return {
      pages,
      PAGE_WIDTH,
      handleScroll,
      handleClickUrl,
      visibleTooltip,
      tooltipContent,
      tooltipPosition,
      showToolTip,
      hideToolTip,
    };
  }
});
</script>

<style scoped>
.scrollable-pane {
  width: 100%;
  height: 100%;
  overflow-x: auto;
}

.scrollable-pane .content {
  height: 100%;
}

.page-container {
  height: calc(100% - 15px);
  overflow: hidden;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.tooltip-container {
  position: fixed;
  z-index: 10;
  top: 100px;
  left: 100px;
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  max-height: 400px;
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}

</style>
