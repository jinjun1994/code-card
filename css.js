const style = {
    '--screenBgColor': 'rgba(3, 24, 38, .9)',
    '--listBgColor': '#004462',
    '--dropdown__item_selected': '#409EFF',
    '--panel_cell_Bg_Color': '#00446c',
    '--panel_cell_Color': '#fff',
    '--gisToolbar': 'rgba(7, 51, 62, .9)',
    '--box_button_color': '#b0c1cd',
    '--box_button_filter': 'opacity(100%)',
    '--cell_number_color': '#ffc800',
    '--el-input__inner_placeholder': '#ffd700',
    '--simulate-popper—_Bg_Color': '#004462',
    '--simulate-popper—selected-color': '#409EFF',
  }
for (const [k, v] of Object.entries(styleVar)) {
    document.documentElement.style.setProperty(k, v);
  }