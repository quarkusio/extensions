import styled from "styled-components"
import {
  Tab as UnstyledTab,
  TabList as UnstyledTabList,
  TabPanel as UnstyledTabPanel,
  Tabs as UnstyledTabs
} from "react-tabs"

const Tabs = styled(UnstyledTabs)`
  background: var(--main-background-color);
`

const TabList = styled(UnstyledTabList)`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
`

const Tab = styled(UnstyledTab).attrs({
  selectedClassName: "selected",
  disabledClassName: "disabled"
})`
  flex-grow: 1;
  text-align: center;
  padding: 12px 0;
  list-style: none;
  cursor: pointer;
  border-bottom: 1px solid var(--card-outline);

  &:first-child {
    border-left: none;
  }

  &.selected {
    border-bottom: 5px var(--highlight-color) solid;
  }

  &.disabled {
    color: var(--unlisted-text-color);
    cursor: not-allowed;
  }
`

const TabPanel = styled(UnstyledTabPanel).attrs({ selectedClassName: "selected" })`
  display: none;

  &.selected {
    display: block;
  }
`

Tab.tabsRole = "Tab"
Tabs.tabsRole = "Tabs"
TabPanel.tabsRole = "TabPanel"
TabList.tabsRole = "TabList"

export { Tab, TabList, Tabs, TabPanel }