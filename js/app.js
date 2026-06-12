/**
 * 批量打印系统 - 核心逻辑
 * 邮件合并功能的纯前端实现
 */

// ===== 配置常量 =====
const BASE_MM_TO_PX = 3.7795275591; // 1mm ≈ 3.78px (96dpi)
let MM_TO_PX = BASE_MM_TO_PX;       // 运行时根据缩放动态调整

// ===== 全局状态 =====
const state = {
    paperWidth: 210,   // mm
    paperHeight: 297,  // mm
    bgImage: null,     // base64 背景图
    printBg: true,     // 打印时是否包含背景图
    fields: [],        // 画布上的字段数组
    selectedField: null,
    excelData: [],     // Excel数据数组
    excelHeaders: [],  // Excel表头
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    customFonts: [],   // 用户手动添加的字体
    zoom: 1.0          // 画布显示缩放比例
};

// ===== DOM元素 =====
const $ = id => document.getElementById(id);

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    scanSystemFonts();
    bindEvents();
});

// ===== 扫描系统字体 =====
function scanSystemFonts() {
    // 超大量字体候选列表，覆盖 macOS / Windows / Linux 常见字体
    const fontCandidates = [
        // ===== 中文字体 =====
        'SimSun','SimHei','Microsoft YaHei','KaiTi','FangSong','LiSu','YouYuan',
        'STSong','STHeiti','STKaiti','STFangsong','STZhongsong','STXihei',
        '华文宋体','华文黑体','华文楷体','华文仿宋','华文细黑','华文中宋',
        '宋体','黑体','微软雅黑','楷体','仿宋','隶书','幼圆',
        '思源黑体','Source Han Sans','Source Han Sans SC','Source Han Serif SC',
        'Noto Sans SC','Noto Serif SC','Noto Sans CJK SC','Noto Serif CJK SC',
        'PingFang SC','PingFang HK','PingFang TC',
        '苹方-简','苹方-繁','苹方-港',
        'Hiragino Sans GB','冬青黑体简体中文','Hiragino Mincho ProN',
        'Heiti SC','Heiti TC','STHeiti SC','STHeiti TC',
        'Songti SC','Songti TC','BiauKai','Baoli SC',
        'Libian SC','LingWai TC','Yuppy SC','Yuppy TC',
        'Wawati SC','Wawati TC','Xingkai SC','Xingkai TC',
        'Yuanti SC','Yuanti TC','YuMincho','Hannotate SC','Hannotate TC',
        'HanziPen SC','HanziPen TC',
        'Alibaba PuHuiTi','HarmonyOS Sans','MiSans','OPPO Sans','vivo Sans',
        '仓耳今楷','优设标题黑','站酷快乐体','站酷高端黑',
        // ===== 日文字体 =====
        'Hiragino Maru Gothic ProN','Hiragino Kaku Gothic ProN','Hiragino Kaku Gothic StdN',
        'Osaka','Osaka-Mono','Yu Gothic','Yu Mincho','Meiryo','Meiryo UI',
        'MS Mincho','MS Gothic','MS PMincho','MS PGothic',
        // ===== 韩文字体 =====
        'Apple SD Gothic Neo','Nanum Gothic','Nanum Myeongjo','Nanum Pen Script',
        'Malgun Gothic','Gulim','Dotum','Batang','Gungsuh',
        // ===== macOS 系统字体 =====
        '.AppleSystemUIFont','.AppleSystemUIFontRounded','.SF NS Text',
        '.SF NS Display','.SF NS Mono','.SF Compact Text','.SF Compact Display',
        'San Francisco','SF Pro Display','SF Pro Text','SF Pro Rounded',
        'SF Mono','SF Compact','New York','Apple Color Emoji',
        // ===== 英文基础字体 =====
        'Helvetica','Helvetica Neue','Arial','Arial Black','Arial Narrow','Arial Rounded MT Bold',
        'Times','Times New Roman','Georgia','Garamond','Baskerville',
        'Palatino','Book Antiqua','Century Schoolbook','Bookman Old Style',
        'Verdana','Tahoma','Geneva','Lucida Grande','Lucida Sans Unicode',
        'Trebuchet MS','Impact','Charcoal','Copperplate','Papyrus',
        'Optima','Avenir','Avenir Next','Avenir Next Condensed',
        'Futura','Gill Sans','Gill Sans MT','Franklin Gothic Medium',
        'Franklin Gothic Book','Myriad Pro','Proxima Nova','Segoe UI',
        'Calibri','Cambria','Candara','Consolas','Constantia','Corbel',
        'Courier New','Courier','Didot','Bodoni 72','Bodoni Ornaments',
        'Snell Roundhand','Zapfino','Marker Felt','Chalkboard','Chalkduster',
        'Comic Sans MS','Cochin','Hoefler Text','Hoefler Text Black',
        'Big Caslon','Plantagenet Cherokee','Skia','Silom','Sathu',
        'Kokonor','Krungthep','Lao Sangam MN','Mishafi','Muna',
        'Bebas Neue','Playfair Display','Merriweather','Lora',
        'Crimson Text','Minion Pro','Times LT Std','ITC Franklin Gothic',
        // ===== 等宽字体 =====
        'Menlo','Monaco','Andale Mono','DejaVu Sans Mono',
        'Bitstream Vera Sans Mono','Liberation Mono','Ubuntu Mono',
        'Source Code Pro','IBM Plex Mono','Space Mono','Roboto Mono',
        'Fira Code','Fira Mono','JetBrains Mono','Cascadia Code','Cascadia Mono',
        'Inconsolata','Droid Sans Mono','PT Mono','Oxygen Mono',
        'Noto Sans Mono','Hack','Sudo','Input Mono','DM Mono',
        // ===== 开源/Web字体 =====
        'Open Sans','Roboto','Roboto Slab','Roboto Condensed',
        'Lato','Montserrat','Oswald','Raleway','Nunito','Quicksand',
        'Work Sans','Inter','DM Sans','Josefin Sans','Poppins',
        'Ubuntu','Fira Sans','Fira Sans Condensed',
        'Source Sans Pro','Source Serif Pro','Source Code Pro',
        'Droid Sans','Droid Serif','PT Sans','PT Serif','PT Sans Caption',
        'Exo 2','Rajdhani','Teko','Barlow','Barlow Condensed',
        'Karla','Rubik','Varela Round','Muli','Spectral',
        'Noto Sans','Noto Serif','Noto Sans Mono',
        'Libre Franklin','Libre Baskerville','Cabin','Arvo','Slabo 27px',
        'Bitter','Domine','Vollkorn','Alegreya','Alegreya Sans',
        'Cinzel','Jura','Orbitron','Russo One','Stalinist One',
        'Comfortaa','Righteous','Fredoka One','Baloo','Baloo 2',
        'Indie Flower','Pacifico','Dancing Script','Great Vibes',
        'Satisfy','Allura','Alex Brush','Parisienne','Sacramento',
        'Amatic SC','Caveat','Shadows Into Light','Permanent Marker',
        'Architects Daughter','Kaushan Script','Lobster','Lobster Two',
        'Bangers','Black Ops One','Ruslan Display','Press Start 2P',
        'VT323','Wallpoet','Syncopate','Montserrat Alternates',
        // ===== 图标/特殊字体 =====
        'FontAwesome','Font Awesome 6 Free','Font Awesome 6 Brands',
        'Material Icons','Material Symbols','Segoe Fluent Icons',
        'Webdings','Wingdings','Wingdings 2','Wingdings 3','Symbol',
        'Marlett','Bookshelf Symbol 7','MS Outlook',
        // ===== Adobe 字体 =====
        'Adobe Clean','Adobe Garamond Pro','Adobe Caslon Pro',
        'Minion Pro','Myriad Pro','Trajan Pro','Chaparral Pro',
    ];

    // 去重
    const uniqueFonts = [...new Set(fontCandidates)];

    // 使用 document.fonts.check() 检测字体存在性（浏览器原生 API）
    // 格式：document.fonts.check('12px "字体名"')
    const available = [];
    for (const font of uniqueFonts) {
        try {
            if (document.fonts.check(`12px "${font}"`)) {
                available.push(font);
            }
        } catch (e) {
            // 跳过异常
        }
    }

    // 填充 datalist（扫描到的 + 用户手动添加的）
    const datalist = $('fontList');
    const allFonts = [...new Set([...available, ...state.customFonts])];
    datalist.innerHTML = allFonts.map(f => `<option value="${f}">`).join('');
}

function addCustomFont() {
    const name = $('customFontName').value.trim();
    if (!name) {
        alert('请输入字体名称');
        return;
    }
    // 防止重复添加
    if (state.customFonts.includes(name)) {
        alert(`字体 "${name}" 已在列表中`);
        return;
    }
    // 尝试加载并检测
    document.fonts.load(`12px "${name}"`).then(() => {
        state.customFonts.push(name);
        scanSystemFonts();
        const field = state.fields.find(f => f.id === state.selectedField);
        if (field) {
            field.font = name;
            updateFieldElement(field);
            updatePropPanel();
        }
        $('propFont').value = name;
        $('customFontName').value = '';
        $('customFontRow').classList.add('hidden');
        alert(`字体 "${name}" 已添加`);
    }).catch(() => {
        state.customFonts.push(name);
        scanSystemFonts();
        const field = state.fields.find(f => f.id === state.selectedField);
        if (field) {
            field.font = name;
            updateFieldElement(field);
            updatePropPanel();
        }
        $('propFont').value = name;
        $('customFontName').value = '';
        $('customFontRow').classList.add('hidden');
        alert(`字体 "${name}" 已添加（请确保系统中已安装）`);
    });
}

function setZoom(ratio) {
    // 限制缩放范围：30% ~ 300%
    ratio = Math.max(0.3, Math.min(3.0, ratio));
    state.zoom = Math.round(ratio * 10) / 10; // 保留一位小数
    MM_TO_PX = BASE_MM_TO_PX * state.zoom;
    $('zoomValue').textContent = Math.round(state.zoom * 100) + '%';

    // 重绘画布和标尺
    updateCanvasSize();
    // 重绘所有字段
    state.fields.forEach(field => {
        updateFieldElement(field);
    });
}

function zoomToFit() {
    // 计算画布区域可用空间
    const wrapper = document.querySelector('.canvas-wrapper');
    const availW = wrapper.clientWidth - 80;  // 留边距
    const availH = wrapper.clientHeight - 80;
    const canvasW = state.paperWidth * BASE_MM_TO_PX;
    const canvasH = state.paperHeight * BASE_MM_TO_PX;

    const ratioX = availW / canvasW;
    const ratioY = availH / canvasH;
    const ratio = Math.min(ratioX, ratioY, 2.0); // 最大放大到 200%

    setZoom(ratio);
}

function initCanvas() {
    updateCanvasSize();
    renderRulers();
}

function updateCanvasSize() {
    const canvas = $('canvas');
    const w = state.paperWidth * MM_TO_PX;
    const h = state.paperHeight * MM_TO_PX;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    $('canvasSize').textContent = `${state.paperWidth} × ${state.paperHeight} mm`;
    renderRulers();
}

// ===== 标尺渲染 =====
function renderRulers() {
    const rulerTop = $('rulerTop');
    const rulerLeft = $('rulerLeft');
    if (!rulerTop || !rulerLeft) return;

    // 设置标尺尺寸匹配画布
    const w = state.paperWidth * MM_TO_PX;
    const h = state.paperHeight * MM_TO_PX;
    rulerTop.style.width = w + 'px';
    rulerLeft.style.height = h + 'px';

    // 清旧刻度
    rulerTop.innerHTML = '';
    rulerLeft.innerHTML = '';

    // 水平标尺（顶部）
    const totalMmH = Math.ceil(state.paperWidth);
    for (let mm = 0; mm <= totalMmH; mm++) {
        const px = mm * MM_TO_PX;
        const isMajor = mm % 10 === 0;
        const isHalf = mm % 5 === 0;
        const mark = document.createElement('div');
        mark.className = 'ruler-mark-h' + (isMajor ? ' major' : '');
        mark.style.left = px + 'px';
        mark.style.height = isMajor ? '60%' : (isHalf ? '40%' : '25%');
        mark.style.top = isMajor ? '40%' : (isHalf ? '30%' : '75%');
        if (isMajor) {
            const label = document.createElement('span');
            label.className = 'ruler-label';
            label.textContent = mm;
            mark.appendChild(label);
        }
        rulerTop.appendChild(mark);
    }

    // 垂直标尺（左侧）
    const totalMmV = Math.ceil(state.paperHeight);
    for (let mm = 0; mm <= totalMmV; mm++) {
        const px = mm * MM_TO_PX;
        const isMajor = mm % 10 === 0;
        const isHalf = mm % 5 === 0;
        const mark = document.createElement('div');
        mark.className = 'ruler-mark-v' + (isMajor ? ' major' : '');
        mark.style.top = px + 'px';
        mark.style.width = isMajor ? '60%' : (isHalf ? '40%' : '25%');
        mark.style.left = isMajor ? '40%' : (isHalf ? '30%' : '75%');
        if (isMajor) {
            const label = document.createElement('span');
            label.className = 'ruler-label';
            label.textContent = mm;
            mark.appendChild(label);
        }
        rulerLeft.appendChild(mark);
    }
}

// ===== 事件绑定 =====
function bindEvents() {
    // 纸张选择
    $('paperSize').addEventListener('change', onPaperChange);
    $('paperW').addEventListener('change', onCustomSizeChange);
    $('paperH').addEventListener('change', onCustomSizeChange);

    // 背景图
    $('btnBgImage').addEventListener('click', () => $('bgImageInput').click());
    $('bgImageInput').addEventListener('change', onBgImageUpload);
    $('btnClearBg').addEventListener('click', clearBgImage);
    $('printBgToggle').addEventListener('change', (e) => {
        state.printBg = e.target.checked;
    });

    // 模板
    $('btnSaveTemplate').addEventListener('click', saveTemplate);
    $('btnLoadTemplate').addEventListener('click', () => $('templateInput').click());
    $('templateInput').addEventListener('change', loadTemplate);

    // 工程
    $('btnSaveProject').addEventListener('click', saveProject);
    $('btnLoadProject').addEventListener('click', () => $('projectInput').click());
    $('projectInput').addEventListener('change', loadProject);

    // 打印
    $('btnPreview').addEventListener('click', openPreview);
    $('btnPrint').addEventListener('click', openPrintRange);

    // 缩放控制
    $('btnZoomIn').addEventListener('click', () => setZoom(state.zoom + 0.1));
    $('btnZoomOut').addEventListener('click', () => setZoom(state.zoom - 0.1));
    $('btnZoomFit').addEventListener('click', zoomToFit);

    // Excel
    $('excelInput').addEventListener('change', onExcelUpload);

    // 属性面板
    $('propField').addEventListener('change', updateSelectedField);
    $('propX').addEventListener('input', updateSelectedField);
    $('propY').addEventListener('input', updateSelectedField);
    $('propW').addEventListener('input', updateSelectedField);
    $('propFont').addEventListener('input', updateSelectedField);
    $('propFont').addEventListener('change', updateSelectedField);
    // 字体选择器：修复 Chrome/Safari datalist 有值时不弹列表的问题
    let savedFontValue = '';
    let isDatalistOpen = false;
    $('propFont').addEventListener('focus', () => {
        const input = $('propFont');
        if (input.value && !isDatalistOpen) {
            savedFontValue = input.value;
            input.value = '';
            isDatalistOpen = true;
            // 部分浏览器支持 showPicker()
            try { input.showPicker(); } catch (e) { /* ignore */ }
        }
    });
    $('propFont').addEventListener('blur', () => {
        const input = $('propFont');
        isDatalistOpen = false;
        if (!input.value && savedFontValue) {
            input.value = savedFontValue;
        } else if (input.value) {
            savedFontValue = input.value;
        }
    });
    // 输入时尝试触发字体实时预览（debounce 优化）
    let fontInputTimeout;
    $('propFont').addEventListener('input', () => {
        clearTimeout(fontInputTimeout);
        fontInputTimeout = setTimeout(updateSelectedField, 30);
    });
    $('propSize').addEventListener('input', updateSelectedField);
    $('propColor').addEventListener('input', onColorPickerChange);
    $('propColorHex').addEventListener('input', onColorHexChange);
    $('propAlign').addEventListener('change', updateSelectedField);
    $('propVAlign').addEventListener('change', updateSelectedField);
    $('propBold').addEventListener('change', updateSelectedField);
    $('btnDeleteField').addEventListener('click', deleteSelectedField);

    // 自定义字体
    $('btnAddCustomFont').addEventListener('click', () => {
        $('customFontRow').classList.toggle('hidden');
    });
    $('btnConfirmAddFont').addEventListener('click', addCustomFont);
    $('btnRescanFonts').addEventListener('click', () => {
        scanSystemFonts();
        alert('字体列表已刷新');
    });

    // 画布拖拽交互
    const canvas = $('fieldLayer');
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    document.addEventListener('mousemove', onCanvasMouseMove);
    document.addEventListener('mouseup', onCanvasMouseUp);

    // 字段列表拖拽
    $('fieldList').addEventListener('dragstart', onFieldDragStart);

    // 画布接收拖拽
    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', onFieldDrop);

    // 预览弹窗
    $('closePreview').addEventListener('click', closePreview);
    $('prevPage').addEventListener('click', () => navigatePreview(-1));
    $('nextPage').addEventListener('click', () => navigatePreview(1));
    $('btnPrintFromPreview').addEventListener('click', printFromPreview);
    $('btnBackToRange').addEventListener('click', backToRange);

    // 表头确认弹窗
    $('closeHeaderModal').addEventListener('click', closeHeaderModal);
    $('btnYesHeader').addEventListener('click', () => confirmHeader(true));
    $('btnNoHeader').addEventListener('click', () => confirmHeader(false));

    // 打印范围弹窗
    $('closePrintRange').addEventListener('click', closePrintRange);
    $('btnCancelPrint').addEventListener('click', closePrintRange);
    $('btnPreviewThenPrint').addEventListener('click', previewThenPrint);

    // 输入校验：起始行不能超过结束行
    $('rangeStart').addEventListener('input', () => {
        const start = parseInt($('rangeStart').value) || 1;
        const end = parseInt($('rangeEnd').value) || 1;
        if (start > end) $('rangeEnd').value = start;
    });
    $('rangeEnd').addEventListener('input', () => {
        const start = parseInt($('rangeStart').value) || 1;
        const end = parseInt($('rangeEnd').value) || 1;
        if (end < start) $('rangeStart').value = end;
    });
    // 打印后清理内存
    window.addEventListener('afterprint', cleanupPrintPages);
}

// ===== 纸张设置 =====
function onPaperChange() {
    const sel = $('paperSize');
    const opt = sel.options[sel.selectedIndex];
    if (sel.value === 'custom') {
        $('customSize').classList.remove('hidden');
    } else {
        $('customSize').classList.add('hidden');
        state.paperWidth = parseFloat(opt.dataset.w);
        state.paperHeight = parseFloat(opt.dataset.h);
        $('paperW').value = state.paperWidth;
        $('paperH').value = state.paperHeight;
        updateCanvasSize();
    }
}

function onCustomSizeChange() {
    state.paperWidth = parseFloat($('paperW').value) || 210;
    state.paperHeight = parseFloat($('paperH').value) || 297;
    updateCanvasSize();
}

// ===== 背景图 =====
function onBgImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        state.bgImage = reader.result;
        renderBgImage();
    };
    reader.readAsDataURL(file);
}

function renderBgImage() {
    const layer = $('bgLayer');
    if (state.bgImage) {
        layer.innerHTML = `<img src="${state.bgImage}" alt="background">`;
    } else {
        layer.innerHTML = '';
    }
}

function clearBgImage() {
    state.bgImage = null;
    renderBgImage();
}

// ===== Excel 解析 =====
let pendingExcelJson = null;

function onExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (json.length < 1) {
                alert('Excel文件为空');
                return;
            }

            pendingExcelJson = json;
            showHeaderConfirm();
        } catch (err) {
            alert('解析Excel失败: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
}

function showHeaderConfirm() {
    const json = pendingExcelJson;
    if (!json || json.length === 0) return;

    const container = $('headerPreview');
    const firstRow = json[0];

    // 预览前3行
    let html = '<table><tr>';
    for (let j = 0; j < Math.min(firstRow.length, 8); j++) {
        const val = firstRow[j];
        html += `<th class="highlight-header">${escapeHtml(val !== undefined ? String(val) : '')}</th>`;
    }
    if (firstRow.length > 8) html += '<th>...</th>';
    html += '</tr>';

    for (let i = 1; i < Math.min(json.length, 4); i++) {
        html += '<tr>';
        for (let j = 0; j < Math.min(firstRow.length, 8); j++) {
            const val = json[i][j];
            html += `<td>${escapeHtml(val !== undefined ? String(val) : '')}</td>`;
        }
        if (firstRow.length > 8) html += '<td>...</td>';
        html += '</tr>';
    }

    if (json.length > 4) {
        html += `<tr><td colspan="${Math.min(firstRow.length, 8) + (firstRow.length > 8 ? 1 : 0)}" style="text-align:center;color:#999;">... 共 ${json.length} 行数据 ...</td></tr>`;
    }
    html += '</table>';

    container.innerHTML = html;
    $('headerModal').classList.remove('hidden');
}

function closeHeaderModal() {
    $('headerModal').classList.add('hidden');
    pendingExcelJson = null;
}

function confirmHeader(hasHeader) {
    const json = pendingExcelJson;
    if (!json) return;

    if (hasHeader) {
        state.excelHeaders = json[0].map(h => String(h).trim());
        state.excelData = json.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
    } else {
        // 第一行也是数据，生成默认字段名
        const colCount = json[0].length;
        state.excelHeaders = [];
        for (let i = 0; i < colCount; i++) {
            state.excelHeaders.push(`字段${i + 1}`);
        }
        state.excelData = json.filter(row => row.some(cell => cell !== undefined && cell !== ''));
    }

    $('excelInfo').innerHTML = `共 <b>${state.excelData.length}</b> 行数据<br>${state.excelHeaders.length} 个字段${hasHeader ? '（含表头）' : '（无表头）'}`;
    renderFieldList();
    renderDataPreview();
    updatePropFieldOptions();

    closeHeaderModal();
}

function renderFieldList() {
    const list = $('fieldList');
    if (state.excelHeaders.length === 0) {
        list.innerHTML = '<p class="placeholder">请先上传Excel</p>';
        return;
    }
    list.innerHTML = state.excelHeaders.map(h =>
        `<span class="field-tag" draggable="true" data-field="${escapeHtml(h)}">${escapeHtml(h)}</span>`
    ).join('');
}

function renderDataPreview() {
    const div = $('dataPreview');
    if (state.excelData.length === 0) {
        div.innerHTML = '<p class="placeholder">暂无数据</p>';
        return;
    }
    const maxRows = Math.min(state.excelData.length, 50);
    let html = '<table><tr>' + state.excelHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>';
    for (let i = 0; i < maxRows; i++) {
        html += '<tr>';
        for (let j = 0; j < state.excelHeaders.length; j++) {
            const val = state.excelData[i][j];
            html += `<td>${escapeHtml(val !== undefined ? String(val) : '')}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    if (state.excelData.length > 50) {
        html += `<p class="placeholder">仅显示前50行，共${state.excelData.length}行</p>`;
    }
    div.innerHTML = html;
}

function updatePropFieldOptions() {
    const sel = $('propField');
    sel.innerHTML = '<option value="">-- 选择字段 --</option>' +
        state.excelHeaders.map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`).join('');
}

// ===== 字段拖拽到画布 =====
function onFieldDragStart(e) {
    if (e.target.classList.contains('field-tag')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.field);
        e.target.classList.add('dragging');
    }
}

function onFieldDrop(e) {
    e.preventDefault();
    const fieldName = e.dataTransfer.getData('text/plain');
    document.querySelectorAll('.field-tag.dragging').forEach(el => el.classList.remove('dragging'));
    if (!fieldName) return;

    // 计算放置位置（相对于画布，单位mm）
    const canvas = $('canvas');
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const mmX = px / MM_TO_PX;
    const mmY = py / MM_TO_PX;

    createField(fieldName, mmX, mmY);
}

// ===== 创建/渲染字段 =====
let fieldIdCounter = 0;

function createField(fieldName, mmX, mmY) {
    const field = {
        id: 'f_' + (++fieldIdCounter),
        fieldName: fieldName,
        x: Math.max(0, mmX),
        y: Math.max(0, mmY),
        width: 0,
        font: 'SimSun',
        size: 12,
        color: '#000000',
        align: 'left',
        vAlign: 'top',
        bold: false
    };
    state.fields.push(field);
    renderField(field);
    selectField(field.id);
    updateFieldCount();
}

function renderField(field) {
    const el = document.createElement('div');
    el.className = 'canvas-field';
    el.id = field.id;
    el.dataset.id = field.id;

    // 设置位置
    el.style.left = (field.x * MM_TO_PX) + 'px';
    el.style.top = (field.y * MM_TO_PX) + 'px';
    if (field.width > 0) {
        el.style.width = (field.width * MM_TO_PX) + 'px';
    }

    // 设置样式
    el.style.fontFamily = field.font;
    el.style.fontSize = field.size + 'pt';
    el.style.color = field.color;
    el.style.textAlign = field.align;
    el.style.fontWeight = field.bold ? 'bold' : 'normal';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.justifyContent = getVAlignStyle(field.vAlign);

    // 内容
    const sampleValue = getSampleValue(field.fieldName);
    el.innerHTML = `<div class="field-label">${escapeHtml(field.fieldName)}</div>
                    <div class="field-value">${escapeHtml(sampleValue)}</div>`;

    $('fieldLayer').appendChild(el);
}

function getVAlignStyle(vAlign) {
    switch (vAlign) {
        case 'middle': return 'center';
        case 'bottom': return 'flex-end';
        default: return 'flex-start';
    }
}

function getSampleValue(fieldName) {
    if (state.excelData.length === 0) return '示例';
    const idx = state.excelHeaders.indexOf(fieldName);
    if (idx < 0) return '示例';
    const val = state.excelData[0][idx];
    return val !== undefined ? String(val) : '';
}

function updateFieldElement(field) {
    const el = $(field.id);
    if (!el) return;

    el.style.left = (field.x * MM_TO_PX) + 'px';
    el.style.top = (field.y * MM_TO_PX) + 'px';
    if (field.width > 0) {
        el.style.width = (field.width * MM_TO_PX) + 'px';
    } else {
        el.style.width = '';
    }
    el.style.fontFamily = field.font;
    el.style.fontSize = field.size + 'pt';
    el.style.color = field.color;
    el.style.textAlign = field.align;
    el.style.fontWeight = field.bold ? 'bold' : 'normal';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.justifyContent = getVAlignStyle(field.vAlign);

    const sampleValue = getSampleValue(field.fieldName);
    el.innerHTML = `<div class="field-label">${escapeHtml(field.fieldName)}</div>
                    <div class="field-value">${escapeHtml(sampleValue)}</div>`;
}

function updateFieldCount() {
    $('fieldCount').textContent = `${state.fields.length} 个字段`;
}

// ===== 字段选中与移动 =====

const SNAP_THRESHOLD = 2; // mm 参考线显示阈值

function onCanvasMouseDown(e) {
    const target = e.target.closest('.canvas-field');
    if (!target) {
        deselectAll();
        hideGuides();
        return;
    }

    e.stopPropagation();
    const id = target.dataset.id;
    selectField(id);

    state.isDragging = true;
    state.dragOffset = {
        x: e.clientX,
        y: e.clientY
    };
}

function onCanvasMouseMove(e) {
    if (!state.isDragging || !state.selectedField) return;
    e.preventDefault();

    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;

    const dx = (e.clientX - state.dragOffset.x) / MM_TO_PX;
    const dy = (e.clientY - state.dragOffset.y) / MM_TO_PX;

    // 直接跟随鼠标，丝滑移动，不吸附
    field.x = Math.max(0, field.x + dx);
    field.y = Math.max(0, field.y + dy);

    state.dragOffset = { x: e.clientX, y: e.clientY };

    updateFieldElement(field);
    updatePropPanel();

    // 只显示参考线，不强制吸附
    showAlignmentGuides(field);
}

function showAlignmentGuides(field) {
    const el = $(field.id);
    const elW = el ? parseFloat(el.offsetWidth) / MM_TO_PX : (field.width || 0);
    const elH = el ? parseFloat(el.offsetHeight) / MM_TO_PX : (field.size * 0.4);

    const currLeft = field.x;
    const currRight = field.x + elW;
    const currCenterX = field.x + elW / 2;
    const currTop = field.y;
    const currBottom = field.y + elH;
    const currCenterY = field.y + elH / 2;

    // 找最近的对齐目标
    let closestXDist = Infinity;
    let guideX = null;
    let closestYDist = Infinity;
    let guideY = null;

    for (const other of state.fields) {
        if (other.id === field.id) continue;
        const otherEl = $(other.id);
        const otherW = otherEl ? parseFloat(otherEl.offsetWidth) / MM_TO_PX : (other.width || 0);
        const otherH = otherEl ? parseFloat(otherEl.offsetHeight) / MM_TO_PX : (other.size * 0.4);

        const otherLeft = other.x;
        const otherRight = other.x + otherW;
        const otherCenterX = other.x + otherW / 2;

        // X轴：检测当前元素各边缘到其他元素各边缘的距离
        const xTargets = [
            { from: currLeft, to: otherLeft },
            { from: currRight, to: otherRight },
            { from: currCenterX, to: otherCenterX },
            { from: currLeft, to: otherRight },
            { from: currRight, to: otherLeft },
        ];

        for (const t of xTargets) {
            const dist = Math.abs(t.from - t.to);
            if (dist < SNAP_THRESHOLD && dist < closestXDist) {
                closestXDist = dist;
                guideX = t.to;
            }
        }
    }

    for (const other of state.fields) {
        if (other.id === field.id) continue;
        const otherEl = $(other.id);
        const otherH = otherEl ? parseFloat(otherEl.offsetHeight) / MM_TO_PX : (other.size * 0.4);

        const otherTop = other.y;
        const otherBottom = other.y + otherH;
        const otherCenterY = other.y + otherH / 2;

        const yTargets = [
            { from: currTop, to: otherTop },
            { from: currBottom, to: otherBottom },
            { from: currCenterY, to: otherCenterY },
            { from: currTop, to: otherBottom },
            { from: currBottom, to: otherTop },
        ];

        for (const t of yTargets) {
            const dist = Math.abs(t.from - t.to);
            if (dist < SNAP_THRESHOLD && dist < closestYDist) {
                closestYDist = dist;
                guideY = t.to;
            }
        }
    }

    // 显示/隐藏参考线
    const guideH = $('guideH');
    const guideV = $('guideV');

    if (guideY !== null) {
        guideH.style.top = (guideY * MM_TO_PX) + 'px';
        guideH.classList.add('active');
    } else {
        guideH.classList.remove('active');
    }

    if (guideX !== null) {
        guideV.style.left = (guideX * MM_TO_PX) + 'px';
        guideV.classList.add('active');
    } else {
        guideV.classList.remove('active');
    }
}

function onCanvasMouseUp() {
    state.isDragging = false;
    hideGuides();
}

function hideGuides() {
    $('guideH').classList.remove('active');
    $('guideV').classList.remove('active');
}

// ===== 键盘微调 =====
document.addEventListener('keydown', (e) => {
    if (!state.selectedField) return;
    // 只响应方向键
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    e.preventDefault();

    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;

    // Shift = 1mm，无 Shift = 0.1mm 微调
    const step = e.shiftKey ? 1.0 : 0.1;

    switch (e.key) {
        case 'ArrowUp':
            field.y = Math.max(0, field.y - step);
            break;
        case 'ArrowDown':
            field.y = Math.max(0, field.y + step);
            break;
        case 'ArrowLeft':
            field.x = Math.max(0, field.x - step);
            break;
        case 'ArrowRight':
            field.x = Math.max(0, field.x + step);
            break;
    }

    updateFieldElement(field);
    updatePropPanel();
});

function selectField(id) {
    deselectAll();
    state.selectedField = id;
    const el = document.querySelector(`.canvas-field[data-id="${id}"]`);
    if (el) el.classList.add('selected');

    $('propPanel').classList.remove('disabled');
    $('noSelection').classList.add('hidden');
    updatePropPanel();
}

function deselectAll() {
    state.selectedField = null;
    document.querySelectorAll('.canvas-field.selected').forEach(el => el.classList.remove('selected'));
    $('propPanel').classList.add('disabled');
    $('noSelection').classList.remove('hidden');
}

// ===== 属性面板 =====
function updatePropPanel() {
    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;

    $('propField').value = field.fieldName;
    $('propX').value = field.x.toFixed(1);
    $('propY').value = field.y.toFixed(1);
    $('propW').value = field.width > 0 ? field.width.toFixed(1) : '';
    $('propFont').value = field.font;
    $('propSize').value = field.size;
    $('propColor').value = field.color;
    $('propColorHex').value = field.color;
    $('propAlign').value = field.align;
    $('propVAlign').value = field.vAlign || 'top';
    $('propBold').checked = field.bold;
}

function updateSelectedField() {
    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;

    field.fieldName = $('propField').value || field.fieldName;
    field.x = parseFloat($('propX').value) || 0;
    field.y = parseFloat($('propY').value) || 0;
    const w = parseFloat($('propW').value);
    field.width = isNaN(w) ? 0 : w;
    field.font = $('propFont').value;
    field.size = parseInt($('propSize').value) || 12;
    field.align = $('propAlign').value;
    field.vAlign = $('propVAlign').value;
    field.bold = $('propBold').checked;

    updateFieldElement(field);
}

function onColorPickerChange() {
    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;
    field.color = $('propColor').value;
    $('propColorHex').value = field.color;
    updateFieldElement(field);
}

function onColorHexChange() {
    const field = state.fields.find(f => f.id === state.selectedField);
    if (!field) return;
    let hex = $('propColorHex').value.trim();
    // 自动补全 #
    if (hex && !hex.startsWith('#')) {
        hex = '#' + hex;
    }
    // 校验是否是有效的 hex 颜色
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        field.color = hex;
        $('propColor').value = hex;
        updateFieldElement(field);
    }
}

function deleteSelectedField() {
    if (!state.selectedField) return;
    const el = $(state.selectedField);
    if (el) el.remove();
    state.fields = state.fields.filter(f => f.id !== state.selectedField);
    deselectAll();
    updateFieldCount();
}

// ===== 模板保存/加载 =====
function saveTemplate() {
    const template = {
        version: 1,
        paperWidth: state.paperWidth,
        paperHeight: state.paperHeight,
        bgImage: state.bgImage,
        printBg: state.printBg,
        fields: state.fields.map(f => ({
            fieldName: f.fieldName,
            x: f.x,
            y: f.y,
            width: f.width,
            font: f.font,
            size: f.size,
            color: f.color,
            align: f.align,
            vAlign: f.vAlign,
            bold: f.bold
        }))
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `打印模板_${state.paperWidth}x${state.paperHeight}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadTemplate(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const template = JSON.parse(ev.target.result);

            // 恢复纸张
            state.paperWidth = template.paperWidth || 210;
            state.paperHeight = template.paperHeight || 297;
            $('paperW').value = state.paperWidth;
            $('paperH').value = state.paperHeight;
            updateCanvasSize();

            // 恢复背景
            state.bgImage = template.bgImage || null;
            state.printBg = template.printBg !== false;
            $('printBgToggle').checked = state.printBg;
            renderBgImage();

            // 恢复字段
            state.fields = [];
            $('fieldLayer').innerHTML = '';
            fieldIdCounter = 0;

            if (template.fields) {
                template.fields.forEach(tf => {
                    const field = {
                        id: 'f_' + (++fieldIdCounter),
                        fieldName: tf.fieldName,
                        x: tf.x,
                        y: tf.y,
                        width: tf.width || 0,
                        font: tf.font || 'SimSun',
                        size: tf.size || 12,
                        color: tf.color || '#000000',
                        align: tf.align || 'left',
                        vAlign: tf.vAlign || 'top',
                        bold: tf.bold || false
                    };
                    state.fields.push(field);
                    renderField(field);
                });
            }

            updateFieldCount();
            deselectAll();
            alert('模板加载成功');
        } catch (err) {
            alert('模板加载失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== 工程文件（模板 + Excel数据）=====
function saveProject() {
    if (state.fields.length === 0) {
        alert('画布为空，没有可保存的内容');
        return;
    }

    const project = {
        version: 2,
        type: 'project',
        paperWidth: state.paperWidth,
        paperHeight: state.paperHeight,
        bgImage: state.bgImage,
        printBg: state.printBg,
        fields: state.fields.map(f => ({
            fieldName: f.fieldName,
            x: f.x,
            y: f.y,
            width: f.width,
            font: f.font,
            size: f.size,
            color: f.color,
            align: f.align,
            vAlign: f.vAlign,
            bold: f.bold
        })),
        excelHeaders: state.excelHeaders,
        excelData: state.excelData,
        customFonts: state.customFonts
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `打印工程_${state.paperWidth}x${state.paperHeight}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadProject(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const project = JSON.parse(ev.target.result);

            if (!project.type || project.type !== 'project') {
                alert('这不是工程文件，请使用"加载模板"功能');
                return;
            }

            // 恢复纸张
            state.paperWidth = project.paperWidth || 210;
            state.paperHeight = project.paperHeight || 297;
            $('paperW').value = state.paperWidth;
            $('paperH').value = state.paperHeight;
            updateCanvasSize();

            // 恢复背景
            state.bgImage = project.bgImage || null;
            state.printBg = project.printBg !== false;
            $('printBgToggle').checked = state.printBg;
            renderBgImage();

            // 恢复字段
            state.fields = [];
            $('fieldLayer').innerHTML = '';
            fieldIdCounter = 0;

            if (project.fields) {
                project.fields.forEach(pf => {
                    const field = {
                        id: 'f_' + (++fieldIdCounter),
                        fieldName: pf.fieldName,
                        x: pf.x,
                        y: pf.y,
                        width: pf.width || 0,
                        font: pf.font || 'SimSun',
                        size: pf.size || 12,
                        color: pf.color || '#000000',
                        align: pf.align || 'left',
                        vAlign: pf.vAlign || 'top',
                        bold: pf.bold || false
                    };
                    state.fields.push(field);
                    renderField(field);
                });
            }

            // 恢复 Excel 数据和自定义字体
            state.excelHeaders = project.excelHeaders || [];
            state.excelData = project.excelData || [];
            state.customFonts = project.customFonts || [];

            // 刷新UI
            $('excelInfo').innerHTML = state.excelData.length > 0
                ? `共 <b>${state.excelData.length}</b> 行数据<br>${state.excelHeaders.length} 个字段`
                : '';
            renderFieldList();
            renderDataPreview();
            updatePropFieldOptions();
            updateFieldCount();
            deselectAll();

            alert('工程加载成功');
        } catch (err) {
            alert('工程加载失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== 预览 =====
let previewIndex = 0;

let printRangeStart = 0;
let printRangeEnd = 0;

function openPreview() {
    if (state.fields.length === 0) {
        alert('请先添加字段');
        return;
    }
    if (state.excelData.length === 0) {
        alert('请先上传Excel数据');
        return;
    }
    previewIndex = 0;
    printRangeStart = 0;
    printRangeEnd = state.excelData.length - 1;
    renderPreviewPage();
    $('previewFooter').classList.add('hidden');
    $('previewModal').classList.remove('hidden');
}

function closePreview() {
    $('previewModal').classList.add('hidden');
}

function navigatePreview(delta) {
    const max = printRangeEnd + 1;
    const min = printRangeStart;
    previewIndex = Math.max(min, Math.min(max - 1, previewIndex + delta));
    renderPreviewPage();
}

function renderPreviewPage() {
    const container = $('previewCanvas');
    const row = state.excelData[previewIndex];

    const page = createPrintPage(row, false);
    container.innerHTML = '';
    container.appendChild(page);

    const currentInRange = previewIndex - printRangeStart + 1;
    const totalInRange = printRangeEnd - printRangeStart + 1;
    $('pageInfo').textContent = `第 ${currentInRange} / ${totalInRange} 条`;
    $('prevPage').disabled = previewIndex <= printRangeStart;
    $('nextPage').disabled = previewIndex >= printRangeEnd;
}

// ===== 打印范围弹窗 =====
function openPrintRange() {
    if (state.fields.length === 0) {
        alert('请先添加字段');
        return;
    }
    if (state.excelData.length === 0) {
        alert('请先上传Excel数据');
        return;
    }

    // 设置默认值
    $('rangeTotal').textContent = state.excelData.length;
    $('rangeStart').value = 1;
    $('rangeStart').max = state.excelData.length;
    $('rangeEnd').value = state.excelData.length;
    $('rangeEnd').max = state.excelData.length;

    $('printRangeModal').classList.remove('hidden');
}

function closePrintRange() {
    $('printRangeModal').classList.add('hidden');
}

function previewThenPrint() {
    const start = parseInt($('rangeStart').value) || 1;
    const end = parseInt($('rangeEnd').value) || state.excelData.length;
    const total = state.excelData.length;

    // 校验范围
    const actualStart = Math.max(1, Math.min(start, total));
    const actualEnd = Math.max(actualStart, Math.min(end, total));

    printRangeStart = actualStart - 1;
    printRangeEnd = actualEnd - 1;
    previewIndex = printRangeStart;

    closePrintRange();
    renderPreviewPage();
    $('previewFooter').classList.remove('hidden');
    $('previewModal').classList.remove('hidden');
}

function printFromPreview() {
    closePreview();
    executePrint(printRangeStart, printRangeEnd);
}

function backToRange() {
    closePreview();
    openPrintRange();
}

function executePrint(startIdx, endIdx) {
    const printContainer = $('printContainer');
    printContainer.innerHTML = '';

    // 动态注入打印专用的 @page size
    const styleId = 'dynamic-print-size';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.media = 'print';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${state.paperWidth}mm ${state.paperHeight}mm; margin: 0; }`;

    // 大批量打印：使用 DocumentFragment 减少重排
    const fragment = document.createDocumentFragment();
    for (let i = startIdx; i <= endIdx; i++) {
        const row = state.excelData[i];
        const page = createPrintPage(row, true);
        fragment.appendChild(page);
    }
    printContainer.appendChild(fragment);

    // 等待字体和样式渲染完成
    const count = endIdx - startIdx + 1;
    const delay = Math.min(500, 100 + count * 2); // 最多500ms延迟

    setTimeout(() => {
        window.print();
    }, delay);
}

function createPrintPage(row, forPrint) {
    const page = document.createElement('div');
    page.className = forPrint ? 'print-page' : 'preview-page';

    if (forPrint) {
        // 打印输出用 mm 物理单位，避免 px 映射偏差
        page.style.width = state.paperWidth + 'mm';
        page.style.height = state.paperHeight + 'mm';
    } else {
        // 预览仍用 px 在屏幕上精确显示
        const w = state.paperWidth * MM_TO_PX;
        const h = state.paperHeight * MM_TO_PX;
        page.style.width = w + 'px';
        page.style.height = h + 'px';
    }

    // 背景图（仅在预览或用户勾选"打印包含背景"时显示）
    if (state.bgImage && (!forPrint || state.printBg)) {
        const img = document.createElement('img');
        img.className = 'page-bg';
        img.src = state.bgImage;
        page.appendChild(img);
    }

    // 字段
    state.fields.forEach(field => {
        const el = document.createElement('div');
        el.className = 'page-text';

        if (forPrint) {
            // 打印用 mm
            el.style.left = field.x + 'mm';
            el.style.top = field.y + 'mm';
            if (field.width > 0) {
                el.style.width = field.width + 'mm';
            }
        } else {
            // 预览用 px
            el.style.left = (field.x * MM_TO_PX) + 'px';
            el.style.top = (field.y * MM_TO_PX) + 'px';
            if (field.width > 0) {
                el.style.width = (field.width * MM_TO_PX) + 'px';
            }
        }

        el.style.fontFamily = field.font;
        el.style.fontSize = field.size + 'pt';
        el.style.color = field.color;
        el.style.textAlign = field.align;
        el.style.fontWeight = field.bold ? 'bold' : 'normal';

        // 垂直对齐：通过 transform 调整
        const transforms = [];
        if (field.vAlign === 'middle') transforms.push('translateY(-50%)');
        else if (field.vAlign === 'bottom') transforms.push('translateY(-100%)');
        if (transforms.length > 0) {
            el.style.transform = transforms.join(' ');
        } else {
            el.style.transform = ''; // P0: 重置无垂直对齐时的 transform
        }

        const idx = state.excelHeaders.indexOf(field.fieldName);
        let val = '';
        if (idx >= 0 && row && row[idx] !== undefined) {
            val = String(row[idx]);
        }
        el.textContent = val;

        page.appendChild(el);
    });

    return page;
}

// ===== 打印后清理 =====
function cleanupPrintPages() {
    const printContainer = $('printContainer');
    if (printContainer) {
        printContainer.innerHTML = '';
    }
}

// ===== 工具函数 =====
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
