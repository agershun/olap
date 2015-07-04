/**
 * @author igor.mekterovic@fer.hr
 *
 * using:
 *    jQuery Plugin Boilerplate
 *    by Stefan Gabos
 */


(function ($) {

    "use strict";

    $.jqCube = function (domElement, options) {

        // plugin's default options
        // this is private property and is  accessible only from inside the plugin
        var defaults = {
            // if your plugin is event-driven, you may provide callback capabilities
            // for its events. execute these functions before or after events of your
            // plugin, so that users may customize those particular events without
            // changing the plugin's code
            // onBeforeExecute: function (mdx) { },
            // onError: function(errorThrown, mdx) {}
        };

        // to avoid confusions, use "plugin" to reference the
        // current instance of the object
        var plugin = this;

        // this will hold the merged default, and user-provided options
        // plugin's properties will be available through this object like:
        // plugin.settings.propertyName from inside the plugin or
        // element.data('jqCube').settings.propertyName from outside the plugin,
        // where "element" is the element the plugin is attached to;
        plugin.settings = {};

        var $element = $(domElement);    // reference to the jQuery version of DOM element
            // element  = domElement;    // reference to the actual DOM element

        // private methods
        // these methods can be called only from inside the plugin like:
        // methodName(arg1, arg2, ... argn)
        var onRows = [], onColumns = [], onFilter = [], onSort, currAxis;

        var removeDimFromAxis = function (huname, axis) {
            var index, val;
            for (index = 0; index < axis.length; ++index) {
                val = axis[index];
                if (val[0].huname === huname) {
                    axis.splice(index, 1);
                    return;
                }
            }
        };

        var addToAxis = function (qe, axis, pos, silent) {
            var val, index;
            if (axis === 'Col' || axis === 'Measure') {
                currAxis = onColumns;
            } else if (axis === "Row") {
                currAxis = onRows;
            } else if (axis === 'Filter') {
                currAxis = onFilter;
                if (!silent) {
                    removeDimFromAxis(qe.huname, onRows);
                    removeDimFromAxis(qe.huname, onColumns);
                }
            } else {
                window.alert('unknown axis');
                return;
            }
            for (index = 0; index < currAxis.length; ++index) {
                val = currAxis[index];
                if (val[0].isSameHierarchy(qe)) {
                    if (pos === undefined) val.push(qe);
                    else val.splice(pos, 0, qe);
                    break;
                }
            }
            if (!currAxis.length || index === currAxis.length)
                if (pos === undefined) currAxis.push([qe]);
                else currAxis.splice(pos, 0, [qe]);

            disableTreeElement(qe);


            if (!silent) checkRunQuery();

        };


        var disableTreeElement = function (qe) {
            if (qe.etype === 'Measure') {
                var node = treeDiv.find('li[uname="' + qe.uname + '"]');
                node.attr("rel", "disabledMeasure");
            } else {
                $.each(treeDiv.find('li[huname="' + qe.huname + '"]'), function (index, val) {
                    var etype = $(val).attr("etype");
                    if (etype === 'Level') $(val).attr("rel", "disabledLevel0" + $(val).attr("levelnumber"));  // to properly disable both Levels and Hierarchies
                    else $(val).attr("rel", "disabled" + etype);  // this is Hierarchy
                });
            }
        };
        var enableTreeElement = function (qe) {
            if (qe.etype === 'Measure') {
                var node = treeDiv.find('li[uname="' + qe.uname + '"]');
                node.attr("rel", node.attr("orel"));
            } else {
                $.each(treeDiv.find('li[huname="' + qe.huname + '"]'), function (index, val) {
                    $(val).attr("rel", $(val).attr("orel"));
                });
            }
        };

        var toggleDrillState = function (qe) {
            $.each([onRows, onColumns], function (index, dims) {
                for (var i = 0; i < dims.length; ++i) {
                    if (dims[i][0].isSameHierarchy(qe)) {
                        dims[i][0].toggleDrillMember(qe);
                        return false;
                    }
                }
            });

            checkRunQuery();
        };

        var removeFromFilter = function (qe) {
            if (qe.isHierarchy()) {
                $.each(onFilter, function (i, hierMembers) {
                    if (hierMembers[0].isSameHierarchy(qe)) {
                        onFilter.splice(i, 1);
                        return false;
                    }
                });
                enableTreeElement(qe);
            }  else {
                for (var i = 0; i < onFilter.length; ++i) {
                    if (onFilter[i][0].isSameHierarchy(qe)) {
                        if (onFilter[i].length === 1) {  // last member of the hierarchy
                            qe.etype = 'Hierarchy';
                            removeFromFilter(qe);
                            return;
                        }
                        for (var filti = 0; filti < onFilter[i].length; filti++) {
                            if ((onFilter[i])[filti].uname === qe.uname) {
                                onFilter[i].splice(filti, 1);
                                break;
                            }
                        }

                        // $.each(onFilter[i], function (index, value) {
                        //     if (value.uname === qe.uname) {
                        //         onFilter[i].splice(index, 1);
                        //         return false;
                        //     }
                        // });
                    }
                }
            }
            checkRunQuery();
        };
        var removeFromQuery = function (qe) {
            if (qe.isHierarchy()) {
                var found = false;
                $.each([onRows, onColumns], function (index, currAxis) {
                    $.each(currAxis, function (i, hierMembers) {
                        if (hierMembers[0].isSameHierarchy(qe)) {
                            currAxis.splice(i, 1);
                            found = true;
                            return false;
                        }
                    });
                    if (found) return false;
                });
                enableTreeElement(qe);
            } else if (qe.isMeasure()) {
                $.each(onColumns[onColumns.length - 1], function (index, currMeasure) {
                    if (currMeasure.uname === qe.uname) {
                        onColumns[onColumns.length - 1].splice(index, 1);
                        return false;
                    }
                });
                enableTreeElement(qe);

                if (onColumns[onColumns.length - 1].length === 0) onColumns.length = onColumns.length - 1;  // have removed last Measure, so drop the dim Measure
            } else {
                $.each([onRows, onColumns], function (index, currAxis) {
                    $.each(currAxis, function (i, hierMembers) {
                        if (hierMembers[0].isSameHierarchy(qe)) {
                            hierMembers[0].addExceptMember(qe);
                            return false; // TODO
                        }
                    });
                });
            }
            checkRunQuery();
        };

        var updateFilterPane = function () {
            var filterHtml = '';
            $.each(onFilter, function (index, val) {
                var filtMembers = [];
                $.each(val, function (i, memb) {
                    filtMembers.push('<span class="jqcube-filterMember" ' + memb.toHtml() + '>' + memb.caption + '</span>');
                });
                filterHtml += '<div class="jqcube-filterHierarchy" ' + val[0].toHtml() + '> <b>' + val[0].huname + '</b>:&nbsp;' + filtMembers.join(', ') + '</div>';
            });
            filterDiv.html(filterHtml === '' ? $.jqCube.i18n.Filter.DropCaption : filterHtml);
            filterDiv.find('.jqcube-filterHierarchy').attr("etype", "Hierarchy");
            filterDiv.find('.jqcube-filterHierarchy, .jqcube-filterMember').attr("from", "Filter").draggable(
                {
                    helper: 'clone',
                    start: function () {
                        garbageDiv.css("left", $(this).offset().left + 200)
                                  .css("top", $(this).offset().top + 100);
                        garbageDiv.show();
                    },
                    stop: function () {
                        garbageDiv.hide();
                    }
                }
            );
        };



        var getMdx = function () {
            // build MDX
            var mdx = 'SELECT';
            var arrDims = [];
            $.each(onColumns, function (index, val) {
                var arrMembers = [];
                $.each(val, function (i, memb) {
                    arrMembers.push(memb.getMembersExpression());
                });
                arrDims.push('{' + arrMembers.join(',') + '}');
            });
            mdx += '\n\tNon Empty {' + arrDims.join('*') + '} ON Columns, ';
            arrDims = [];
            $.each(onRows, function (index, val) {
                var arrMembers = [];
                $.each(val, function (i, memb) {
                    arrMembers.push(memb.getMembersExpression());
                });
                arrDims.push('{' + arrMembers.join(',') + '}');
            });
            if (onSort === undefined) {
                mdx += '\n\tNon Empty {' + arrDims.join('*') + '} ON Rows ';
            } else {
                mdx += '\n\tNon Empty Order({' + arrDims.join('*') + '}, ' + (onSort.member.isMeasure() ? onSort.member.uname : onSort.member.huname + '.CurrentMember.Name') + ',' + onSort.type + ') ON Rows ';
            }

            mdx += '\nFrom ' + plugin.settings.FormattedCubeName;
            if (onFilter.length > 0) {
                var arrWith = [], arrWhere = []; //, filterHtml = '';
                $.each(onFilter, function (index, val) {
                    var arrMembers = [];
                    $.each(val, function (i, memb) {
                        arrMembers.push(memb.uname);
                    });
                    var aggName = val[0].huname + '.[Filter members from ' + val[0].huname.replace(/\]/g, '').replace(/\[/g, '') + ']';
                    arrWith.push('MEMBER ' + aggName + ' AS ' + "'Aggregate({" + arrMembers.join(',') + "})'");
                    arrWhere.push(aggName);
                });
                mdx = 'WITH \n\t' + arrWith.join('\n\t') + "\n" + mdx + '\nWHERE (\n\t' + arrWhere.join(",\n\t") + '\n)';
                //filterDiv.html(filterHtml);
            }
            return mdx;
        };

        var checkRunQuery = function () {
            garbageDiv.hide();  // to sweep under the carpet the jquery.ui bug: "Uncaught TypeError: Cannot read property 'options' of undefined" // otherwise, g.can remains visible when query becomes not runnable (last dim memb to filter)
            updateFilterPane();
            if (onRows.length > 0 && onColumns.length > 0) {
                var mdx = getMdx();
                if (mdx.indexOf('[Measures].') > 0) {
                    executeMdx(mdx);
                    enableButtons();
                    return true;
                } //else {
                    //return false; // I do not allow for 'default Measure'
                //}

            } else {
                rTable.setResult(undefined); // When the last dim members (on an axis) is moved to the filter
            }
            tableDiv.html(rTable.getHtml(onColumns, onRows, onSort));        // This will update empty table. Full table will update itself asycnronously (onSuccess)
            disableButtons();
            return false;
        };

        var enableButtons = function () {
            btnSnD.removeAttr('disabled');
            btnOrderBy.removeAttr('disabled');
            if (btnCsv) btnCsv.removeAttr('disabled');
            if (btnSaveMdx) btnSaveMdx.removeAttr('disabled');
        };

        var disableButtons = function () {
            btnSnD.attr('disabled', 'disabled');
            btnOrderBy.attr('disabled', 'disabled');
            if (btnCsv) btnCsv.attr('disabled', 'disabled');
            if (btnSaveMdx) btnSaveMdx.attr('disabled', 'disabled');
        };

        var onSuccessInitDimTree = function (data) {
            var i;
            statusDiv.html($.jqCube.i18n.Toolbar.ReadyCaption);
            if ($.jqCube.i18n.General.Measures !== "Measures" && data && data.Dimensions) {
                for (i = 0; i < data.Dimensions.length; ++i) {
                    if (data.Dimensions[i].data === "Measures") {
                        data.Dimensions[i].data = $.jqCube.i18n.General.Measures;
                        break;
                    }
                }
            }
            var jsFileLocation = $('script[src*=jqcube]')
                                 .filter(function() {
                                    return this.src.match(/jqcube-(\d\.)*\w*\.?js/i);
                                 }).attr('src');  // the js file path
            jsFileLocation = jsFileLocation.replace(/jqcube-(\d\.)*\w*\.?js/i, '');  // the js folder path
            $(treeDiv).jstree({
                "json_data": {
                    "data": data.Dimensions
                },
                "crrm": {
                    "move": {
                        "check_move": function () {
                            return false;
                        }
                    }
                },
                "dnd": {
                    "drop_finish": function (data) {
                        var qe = new QueryElement(data.o);
                        if (data.r.closest('[axis]').attr("axis") === 'Filter') {
                            if (qe.isLevel()) {
                                getFilterLevelMembers(qe.uname);
                            } else {
                                window.alert('You can drop only Levels from dim tree to filter.');
                            }
                        } else {
                            addToAxis(qe, data.r.closest('[axis]').attr("axis"), data.r.closest('[axis]').attr("pos")); // (data.r.attr("pos") === undefined) ? 0 : data.r.attr("pos")
                        }


                    }
                },
                types: {
                    "types": {
                        // the default type
                        "measures": {
                            "icon": { "image": jsFileLocation + "/css/measures.png" },
                            "select_node": function (e) { this.toggle_node(e); return false; }
                        },
                        "dimension": {
                            "select_node": function (e) { this.toggle_node(e); return false; },
                            "icon": { "image": jsFileLocation + "/css/dimension.png" }
                        },
                        "hierarchy": {
                            "select_node": function (e) { this.toggle_node(e); return false; },
                            "icon": { "image": jsFileLocation + "/css/hierarchy.png" }
                        },
                        "level00": { "icon": { "image": jsFileLocation + "/css/level00.png" } },
                        "level01": { "icon": { "image": jsFileLocation + "/css/level01.png" } },
                        "level02": { "icon": { "image": jsFileLocation + "/css/level02.png" } },
                        "level03": { "icon": { "image": jsFileLocation + "/css/level03.png" } },
                        "level04": { "icon": { "image": jsFileLocation + "/css/level04.png" } },
                        "level05": { "icon": { "image": jsFileLocation + "/css/level05.png" } },
                        "level06": { "icon": { "image": jsFileLocation + "/css/level06.png" } },
                        "level07": { "icon": { "image": jsFileLocation + "/css/level07.png" } },
                        "level08": { "icon": { "image": jsFileLocation + "/css/level08.png" } },
                        "level09": { "icon": { "image": jsFileLocation + "/css/level09.png" } },
                        "level10": { "icon": { "image": jsFileLocation + "/css/level10.png" } },
                        "measure": {
                            "icon": { "image": jsFileLocation + "/css/measure.png" }
                        },
                        "disabledMeasure": {
                            "drag_start": false,  // this flag does not work
                            "select_node": false,
                            "open_node": false,
                            "close_node": false,
                            "icon": { "image": jsFileLocation + "/css/measure-g.png" }
                        },
                        "disabledHierarchy": {
                            "drag_start": false,  // this flag does not work
                            "select_node": false,
                            "open_node": false,
                            "close_node": false,
                            "icon": { "image": jsFileLocation + "/css/hierarchy-g.png" }
                        },
                        "disabledLevel00": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level00-g.png" }},
                        "disabledLevel01": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level01-g.png" }},
                        "disabledLevel02": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level02-g.png" }},
                        "disabledLevel03": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level03-g.png" }},
                        "disabledLevel04": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level04-g.png" }},
                        "disabledLevel05": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level05-g.png" }},
                        "disabledLevel06": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level06-g.png" }},
                        "disabledLevel07": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level07-g.png" }},
                        "disabledLevel08": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level08-g.png" }},
                        "disabledLevel09": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level09-g.png" }},
                        "disabledLevel10": { "select_node": false, "open_node": false, "close_node": false, "icon": { "image": jsFileLocation + "/css/level10-g.png" }}
                    }
                },
                "themes": {
                    "theme": "jqcube"
                },
                "callback": {   // various callbacks to attach custom logic to

                    beforemove: function (/* NODE, REF_NODE, TYPE, TREE_OBJ */) {
                        $(".jstree-drop").css("background", "lime");
                        $(".jstree-drop").css("border", "5px solid green");
                        return true;
                    }
                },
                "core": { "animation": 100 },
                "plugins": ["themes", "json_data", "ui", "dnd", "crrm", "types"]
            }).bind("loaded.jstree", function () {
                treeDiv.find("li").each(function () {
                    $(this).addClass('jstree-draggable');
                    if ($(this).attr("etype") === 'Dimension' && $(this).attr("uname").toLowerCase().indexOf('measures') >= 0) $(this).attr("rel", "measures");
                    else if ($(this).attr("etype") === 'Dimension')      $(this).attr("rel", "dimension");
                    else if ($(this).attr("etype") === 'Hierarchy') $(this).attr("rel", "hierarchy");
                    else if ($(this).attr("etype") === 'Level')     $(this).attr("rel", "level0" + $(this).attr("levelnumber"));
                    else if ($(this).attr("etype") === 'Measure')   $(this).attr("rel", "measure");
                });
                treeDiv.find("[rel]").each(function () {
                    $(this).attr("orel", $(this).attr("rel"));
                });
            }).bind("dblclick.jstree", function (event) {
                var node = $(event.target).closest("li");
                if (node.attr("rel").indexOf("disabled") !== 0 && "|Hierarchy|Level|Measure".indexOf(node.attr("etype")) > 0)
                    addToAxis(new QueryElement(node), (node.attr("etype") === 'Measure') ? "Measure" : "Row");

            });

            $(document).bind("drag_start.vakata", function (e, data) {
                if (data.data.jstree && $(data.data.obj[0]).attr("rel").indexOf("disabled") !== 0 && "|Hierarchy|Level|Measure".indexOf($(data.data.obj[0]).attr("etype")) > 0 ){
                    if ($(data.data.obj[0]).attr("etype") === 'Measure') {
                        rightDiv.find(".jqcube-drag-measure-off").each(function () {
                            $(this).addClass('jqcube-drag-measure-on').removeClass('jqcube-drag-measure-off').addClass('jstree-drop');
                        });
                        rightDiv.find("[expndmcs]").each(function () {
                            $(this).attr("colspan", $(this).attr("expndmcs"));
                        });
                        rightDiv.find('*[class^="ResultField"]').each(function () {
                            $(this).attr("colspan", 2);
                        });
                        rightDiv.find("tr").find("td:last").each(function () {
                            if ($(this).attr("class") !== undefined && $(this).attr("class").indexOf("ResultField") != -1) $(this).attr("colspan", 3);
                        });

                    } else  { //if (/*$(data.data.obj[0]).attr("etype") === 'Dimension' ||*/ $(data.data.obj[0]).attr("etype") === 'Hierarchy' || $(data.data.obj[0]).attr("etype") === 'Level')
                        rightDiv.find(".jqcube-drag-col-off, .jqcube-drag-row-off ").each(function () {
                            if ($(this).hasClass('jqcube-drag-col-off')) $(this).addClass('jqcube-drag-col-on').removeClass('jqcube-drag-col-off').addClass('jstree-drop');
                            else $(this).addClass('jqcube-drag-row-on').removeClass('jqcube-drag-row-off').addClass('jstree-drop');
                        });
                        rightDiv.find("[expndcs]").each(function () {
                            $(this).attr("colspan", $(this).attr("expndcs"));
                        });
                        rightDiv.find("[expndrs]").each(function () {
                            $(this).attr("rowspan", $(this).attr("expndrs"));
                        });
                        if ($(data.data.obj[0]).attr("etype") === 'Level') filterDiv.addClass('drag-on');
                    }

                } else {
                    $.vakata.dnd.drag_stop();
                }
            });
            $(document).bind("drag_stop.vakata", function (e, data) {
                // this fires even on collapse/expand, why!?
                if ($.vakata.dnd.is_drag && data.data.jstree && $(data.data.obj[0]).attr("rel").indexOf("disabled") !== 0) {
                    rightDiv.find(".jqcube-drag-measure-on").each(function () {
                        $(this).addClass('jqcube-drag-measure-off').removeClass('jqcube-drag-measure-on').removeClass('jstree-drop');
                    });
                    rightDiv.find(".jqcube-drag-col-on").each(function () {
                        $(this).addClass('jqcube-drag-col-off').removeClass('jqcube-drag-col-on').removeClass('jstree-drop');
                    });
                    rightDiv.find(".jqcube-drag-row-on").each(function () {
                        $(this).addClass('jqcube-drag-row-off').removeClass('jqcube-drag-row-on').removeClass('jstree-drop');
                    });
                    rightDiv.find("[expndcs]").each(function () {
                        $(this).attr("colspan", $(this).attr("clpscs"));
                    });
                    rightDiv.find("[expndrs]").each(function () {
                        $(this).attr("rowspan", $(this).attr("clpsrs"));
                    });
                    rightDiv.find("[expndmcs]").each(function () {
                        $(this).attr("colspan", $(this).attr("clpscs"));
                    });
                    rightDiv.find('td[class^="ResultField"]').attr("colspan", 1);
                }
                filterDiv.removeClass('drag-on');
            });
        };

        var onError = function (jqXHR, textStatus, errorThrown) {
            statusDiv.addClass("jqcube-err");
            statusDiv.html($.jqCube.i18n.Toolbar.ErrorOccurred);
            if (plugin.settings.onError !== undefined) plugin.settings.onError(errorThrown, getMdx());
        };

        var onComplete = function () {
            $(".jqcube-spinner").hide();
            tableDiv.fadeTo(0, 1);
        };

        var initDimensionTree = function () {
            $.ajax({
                url: plugin.settings.DiscoverMetadataURL,
                type: "GET",
                data: {"cubeName": plugin.settings.CubeName},
                cache: false, //because of IE
                success: onSuccessInitDimTree,
                error: onError,
                complete: onComplete,
                dataType: "json"
            });
        };

        var getFilterLevelMembers = function (levelName) {
            statusDiv.html('Retrieving level members ...');
            $(".jqcube-spinner").show();
            $.ajax({
                url: plugin.settings.DiscoverLevelMembersURL,
                type: "GET",
                data: { cubeName: plugin.settings.CubeName, levelName: levelName },
                cache: false, //because of IE
                success: onSuccessGetFilterLevelMembers,
                error: onError,
                complete: onComplete,
                dataType: "json"
            });
        };

        var onSuccessGetFilterLevelMembers = function (data) {
            statusDiv.html("");
            var modal = $('<div class="jqCubeFilterModalPane" title="' + $.jqCube.i18n.Filter.SelectMembersTitle + '"></div>', {});
            modal.html('<button id="filterSelectAllButton">' + $.jqCube.i18n.Filter.SelectMembersAll + '</button>' +
                       '    <button id="filterSelectNoneButton">' + $.jqCube.i18n.Filter.SelectMembersNone + '</button>' +
                       '    <div id="jqcube-filterMemberList" class="jqcube-filterMemberList"></div>' +
                       '    <div style="text-align:center;">' +
                       '        <button id="filterOK">' + $.jqCube.i18n.Filter.SelectMembersOK + '</button>' +
                       '        <button id="filterCancel">' + $.jqCube.i18n.Filter.SelectMembersCancel + '</button>' +
                       '    </div>');

            $.each(data.Members, function (index, value) {
                modal.find('#jqcube-filterMemberList').append('<input type="checkbox"' + (new QueryElement($(value))).toHtml() + ' />&nbsp;' + value.caption + '<br/>');
            });
            modal.find("#filterSelectAllButton").click(function () {
                modal.find("input[type=checkbox]").attr("checked", "true");
            });
            modal.find("#filterSelectNoneButton").click(function () {
                modal.find("input[type=checkbox]").removeAttr("checked");
            });

            modal.find('#filterOK').click(function () {


                $.each(modal.find("input[type=checkbox]"), function (index, val) {
                    if ($(val).is(':checked')) addToAxis(new QueryElement($(val)), "Filter", undefined, true);
                });
                modal.dialog("close");
                checkRunQuery();
            });

            modal.find('#filterCancel').click(function () {
                modal.dialog("close");
            });

            modal.dialog({
                width: 500,
                modal: true
            });
        };

        var executeMdx = function (mdx) {
            if (plugin.settings.onBeforeExecute !== undefined) plugin.settings.onBeforeExecute(mdx);
            statusDiv.html($.jqCube.i18n.Toolbar.ExecutingCaption);
            $(".jqcube-spinner").show();
            tableDiv.fadeTo('fast', 0.5);

            $.ajax({
                url: plugin.settings.ExecuteURL,
                type: "POST",
                data: { "mdx": mdx },
                cache: false, //zbog IE
                success: onExecuteSuccess,
                error: onError,
                complete: onComplete,
                dataType: "json"
            });
        };

        var onExecuteSuccess = function (data) {
            statusDiv.html('Query succesfully executed, formatting results...');
            rTable = new ResultTable(data);
            tableDiv.html(rTable.getHtml(onColumns, onRows, onSort));
            if (data.Status === "OK") {
                statusDiv.html("&nbsp;|&nbsp;" + rTable.result.axisInfo[1].positions.length + "&nbsp;x&nbsp;" + rTable.result.axisInfo[0].positions.length + "&nbsp|&nbsp;" + $.jqCube.i18n.Toolbar.ReadyCaption);
                if (rTable.hasCells) {
                    tableDiv.find('[uname]').draggable(
                        {
                            helper: 'clone',
                            start: function () {
                                garbageDiv.css("left", $(this).offset().left + 200)
                                          .css("top", $(this).offset().top + 100);
                                garbageDiv.show();
                            },
                            stop: function () {
                                garbageDiv.hide();
                            }
                        }
                    );
                    tableDiv.find('[etype=Member]').dblclick(function (eventObject) {
                        var data = $(eventObject.target);
                        toggleDrillState(new QueryElement(data));
                    });
                }
            }  else if (data.Status === "Error") {
                statusDiv.html($.jqCube.i18n.Toolbar.ErrorOccurred);
                plugin.settings.onError(data.Message, getMdx());
            }
        };

        var btnSnD, btnOrderBy;
        var rTable;
        var leftDiv, rightDiv, treeDiv, filterDiv, tableDiv, statusDiv, garbageDiv, toolbarDiv, btnCsv, btnSaveMdx;

        // the "constructor" method that gets called when the object is created
        plugin.init = function () {

            // the plugin's final properties are the merged default and
            // user-provided options (if any)
            plugin.settings = $.extend({}, defaults, options);

            if (plugin.settings.CubeName.charAt(0) === '[') {
                plugin.settings = $.extend({}, plugin.settings, { "FormattedCubeName": plugin.settings.CubeName });
            } else {
                plugin.settings = $.extend({}, plugin.settings, { "FormattedCubeName": '[' + plugin.settings.CubeName + ']' });
            }

            initDimensionTree(plugin.settings.CubeName);

            rTable = new ResultTable();

            // Setup initial elements:
            $element.html('');
            $element.addClass("jqCubeMaster");


            treeDiv = $('<div/>', {});
            leftDiv = $('<div/>', {}).append('<div class="jqcube-dimTreeHeader">' + plugin.settings.CubeName + '</div>').append(treeDiv).appendTo($element);

            filterDiv = $('<div axis="Filter" class="jqcube-filterPane jstree-drop"></div>', {});
            tableDiv = $('<div/>', {});
            toolbarDiv = $('<div class="jqcube-toolbar"></div>', {});

            garbageDiv = $('<div class="jqcube-garbageDiv">&nbsp;</div>', {});
            rightDiv = $('<div/>', {}).append(toolbarDiv).append(filterDiv).append(tableDiv).append(garbageDiv).appendTo($element);

            garbageDiv.hide();

            statusDiv = $('<div class="jqcube-statusBar">' + $.jqCube.i18n.Toolbar.PopulatingCaption + '</div>', {});
            var btnToggle = $("<button/>", {
                "class": "jqcube-toggledimtree-button",
                "text" : "",
                "click": function () { leftDiv.toggle("slow"); $(this).toggleClass("jqcube-toggledimtree-button-off"); }
            });
            toolbarDiv.append(btnToggle);


            btnSnD = $("<button/>", {
                "class": "jqcube-snd-button",
                "text": "",
                "click": function () {
                    var modal = $('<div class="jqCubeSliceAndDice" title="' + $.jqCube.i18n.SliceAndDice.Title + '"></div>', {});
                    modal.html(
                                  '    <table id="jqCubeReorder" style="height:80%; width:100%;  background-color : #E0E0E0; border-collapse: collapse;">' +
                                  '        <tr style="width: 100%; ">' +
                                  '            <td style="width: 50%;  background-color : #E0E0E0; text-align:center; border-right: 2px solid;" rowspan="2">' +
                                  '                <div id="garbageDiv" class="jqcube-garbageDiv"  style="margin: 0 auto; position:relative; "><span id="garbageDivCounter">&nbsp;</span></div>' +
                                  '            </td>' +
                                  '            <td style="width: 50%;">' +
                                  '            <div>' +
                                  '                <div id="jqcube-snd-sortablecols" class="jqCubeReorderConnectedSortable"> &nbsp;' +
                                  '                </div>' +
                                  '            </div>' +
                                  '            </td>' +
                                  '        </tr>' +
                                  '        <tr>' +
                                  '            <td style="width: 50%; border-top: 2px dashed;">' +
                                  '            <div>' +
                                  '                <div id="jqcube-snd-sortablemeasures">' +
                                  '                </div>' +
                                  '            </div>' +
                                  '            </td>' +
                                  '        </tr>' +
                                  '        <tr style="width: 100%;">' +
                                  '            <td style="width: 50%; border-top: 2px solid;">' +
                                  '            <div class="demo" style="float: right">' +
                                  '                <div id="jqcube-snd-sortablerows" class="jqCubeReorderConnectedSortable"> <br/>' +
                                  '                </div>' +
                                  '            </div>  ' +
                                  '            </td>' +
                                  '            <td style="width: 50%; height:100%; border-top: 2px solid; border-left: 2px solid; background-color: white;">' +
                                  '            </td> ' +
                                  '        </tr>' +
                                  '    </table>' +
                                  '    <div style="text-align: center; margin-top: 30px;">' +
                                  '        <button id="jqcube-snd-apply">' + $.jqCube.i18n.SliceAndDice.Apply  + '</button>' +
                                  '        <button id="jqcube-snd-cancel">' + $.jqCube.i18n.SliceAndDice.Close + '</button>     ' +
                                  '    </div>');
                    var i;
                    for (i = 0; i < onColumns.length - 1; ++i) {
                        modal.find("#jqcube-snd-sortablecols").append('<div class="draggable jqcube-snd-col" ' + onColumns[i][0].toHtml() + ' axis="Col" pos="' + i + '">' + onColumns[i][0].caption + '</div> ');
                    }
                    for (i = 0; i < onColumns[onColumns.length-1].length; ++i) {
                        modal.find("#jqcube-snd-sortablemeasures").append('<div class="draggable jqcube-snd-measure" ' + onColumns[onColumns.length - 1][i].toHtml() + ' axis="Measure" pos="' + i + '">' + onColumns[onColumns.length - 1][i].caption + '</div> ');
                    }
                    for (i = 0; i < onRows.length; ++i) {
                        modal.find("#jqcube-snd-sortablerows").append('<div class="draggable jqcube-snd-row" ' + onRows[i][0].toHtml() + ' axis="Row" pos="' + i + '">' + onRows[i][0].caption + '</div> ');
                    }


                    modal.find(".jqCubeReorderConnectedSortable").sortable({
                        connectWith: ".jqCubeReorderConnectedSortable"
                    }).disableSelection();

                    modal.find("#jqcube-snd-sortablemeasures").sortable();

                    modal.find('#garbageDiv').droppable({
                        accept: "[axis][pos]",
                        hoverClass: "jqcube-gcan-hover",
                        drop: function (event, ui) {
                            var a = $(ui.draggable[0]).attr("axis");
                            var p = $(ui.draggable[0]).attr("pos");
                            modal.find("[axis=" + a + "][pos=" + p + "]").remove();
                            $(this).append($(ui.draggable[0]).clone());
                            $(this).find("div").hide();
                            var num = $(this).find("div").size();
                            $(this).find("#garbageDivCounter").html(num > 0 ? num : '');
                        }
                    });

                    modal.find('#jqcube-snd-apply').click(function () {
                        var tmpOnCols = [], tmpOnRows = [];

                        $.each(modal.find("#jqcube-snd-sortablecols").find("div"), function (index, val) {
                            if ($(val).attr("axis") === "Col") tmpOnCols.push(onColumns[$(val).attr("pos")]);
                            else tmpOnCols.push(onRows[$(val).attr("pos")]);
                            $(val).attr("axis", "Col").attr("pos", index);
                        });
                        $.each(modal.find("#jqcube-snd-sortablerows").find("div"), function (index, val) {
                            if ($(val).attr("axis") === "Col") tmpOnRows.push(onColumns[$(val).attr("pos")]);
                            else tmpOnRows.push(onRows[$(val).attr("pos")]);
                            $(val).attr("axis", "Row").attr("pos", index);
                        });
                        var tmpMeasures = [];
                        $.each(modal.find("#jqcube-snd-sortablemeasures").find("div"), function (index, val) {
                            tmpMeasures.push(onColumns[onColumns.length - 1][$(val).attr("pos")]);
                            $(val).attr("pos", index);
                        });
                        if (tmpMeasures.length) tmpOnCols.push(tmpMeasures);
                        onColumns = (tmpOnCols.length) ? tmpOnCols : [];
                        onRows = (tmpOnRows.length) ? tmpOnRows : [];


                        $.each(modal.find("#garbageDiv").find("div"), function (index, val) {
                            enableTreeElement(new QueryElement($(val)));
                        });
                        modal.find("#garbageDiv").html('<span id="garbageDivCounter">&nbsp;</span>'); // remove all, a reset counter(display)

                        checkRunQuery();
                    });

                    modal.find('#jqcube-snd-cancel').click(function () {
                        modal.dialog("close");
                    });

                    modal.dialog({
                        width: "70%",
                        modal: true
                    });


                }
            });
            toolbarDiv.append(btnSnD);
            btnSnD.attr('disabled','disabled');

            btnOrderBy = $("<button/>", {
                "class": "jqcube-orderby-button",
                "text": "",
                "click": function () {
                    var modal = $('<div id="jqCubeOrderPane" title="' + $.jqCube.i18n.Order.Title + '">', {});
                    modal.html('<table style="width:100%; text-align:center; border: solid 1px black; border-collapse: collapse;" border="1">' +
                               '    <tr id="orderHeader"><th class="jqcube-cheader">' + $.jqCube.i18n.Order.OrderType + '</th><th id="orderNoneHeader" class="jqcube-cheader">' + $.jqCube.i18n.Order.None + '</th></tr>' +
                               '    <tr id="orderRadioButtons1" order="ASC"><td style="text-align:left;"><span class="jqcube-order-sortASC"/>&nbsp;Ascending, hierarchical</td><td id="orderNoneCell" rowspan="4"><input type="radio" name="orderRBGroup" id="radioNone"></td></tr>' +
                               '    <tr id="orderRadioButtons2" order="DESC"><td style="text-align:left;"><span class="jqcube-order-sortDESC"/>&nbsp;Descending, hierarchical</td></tr>' +
                               '    <tr id="orderRadioButtons3" order="BASC"><td style="text-align:left;"><span class="jqcube-order-sortBASC"/>&nbsp;Ascending, non-hierarchical</td></tr>' +
                               '    <tr id="orderRadioButtons4" order="BDESC"><td style="text-align:left;"><span class="jqcube-order-sortBDESC"/>&nbsp;Descending, non-hierarchical</td></tr>' +
                               '</table>' +
                               '<div style="text-align:center;">' +
                               '    <button id="orderOK">' + $.jqCube.i18n.Order.Apply + '</button>' +
                               '    <button id="orderCancel">' + $.jqCube.i18n.Order.Close + '</button>' +
                               '</div>');

                    var sortElements = [];
                    $.each(onRows, function (idx, h0) {
                        sortElements.push(h0[0]);
                    });
                    var sortElement = sortElements.concat(onColumns[onColumns.length - 1]);
                    $.each(sortElement, function (idx, qe) {
                        modal.find('#orderNoneHeader').before('<th class="jqcube-cheader">' + qe.caption + '</th>');
                        modal.find('#orderNoneCell').before('<td><input type="radio" name="orderRBGroup" ' + qe.toHtml() + '></td>');
                        modal.find('tr[order][order!=ASC]').append('<td><input type="radio" name="orderRBGroup" ' + qe.toHtml() + '></td>');
                    });

                    if (onSort === undefined) modal.find("#radioNone").attr("checked", "checked");
                    else { // could not escape it like this? why? modal.find("input[uname=" + onSort.member.uname.replace(/\]/g, '\\]').replace(/\[/g, '\\[').replace(/\./g, '\\.').replace(/\ /g, '\\ ')).attr("checked", "checked");
                        $.each(modal.find("input[name=orderRBGroup]"), function (idx, val) {
                            if ($(val).attr("uname") === onSort.member.uname && $(val).closest("[order]").attr("order") === onSort.type) {
                                $(val).attr("checked", "checked");
                                return false;
                            }
                        });
                    }

                    modal.find('#orderOK').click(function () {
                        var selected = modal.find("input[name=orderRBGroup]:checked");
                        if (selected.length === 0 || $(selected[0]).attr("id") === "radioNone") {
                            onSort = undefined;
                        } else {
                            onSort = {
                                "member": new QueryElement($(selected[0])),
                                "type": $(selected[0]).closest('[order]').attr("order")
                            };
                        }
                        checkRunQuery();
                    });

                    modal.find('#orderCancel').click(function () {
                        modal.dialog("close");
                    });

                    modal.dialog({
                        width: "70%",
                        modal: true
                    });
                }
            });
            toolbarDiv.append(btnOrderBy);
            btnOrderBy.attr('disabled', 'disabled');
            if (plugin.settings.CsvURL) {
                btnCsv = $("<button/>", {
                    "class": "jqcube-csv-button",
                    "text": "",
                    "click": function () {
                        // must append it to document, otherwise IE will not submit.
                        var form = document.createElement("form");
                        $(form).attr("action", plugin.settings.CsvURL)
                               .attr("method", "post")
                               .attr("target", "_top")
                               .append($('<input>', {
                                    'name': 'mdx',
                                    'value': getMdx(),
                                    'type': 'hidden'
                                }));
                        document.body.appendChild(form);
                        $(form).submit();
                        document.body.removeChild(form);
                    }
                });
                toolbarDiv.append(btnCsv);
                btnCsv.attr('disabled', 'disabled');
            }
            if (plugin.settings.SaveMdx) {
                var saveComplete = function (jqXHR) {
                    var r = $.parseJSON(jqXHR.responseText);
                    $('<div title="' + $.jqCube.i18n.SaveMdx.Title + '"<p>' + $.jqCube.i18n.General.Status + ': ' + r.Status + '<br>' + $.jqCube.i18n.General.Message + ':' + r.Message + "</p></div>").dialog({
                        modal: true,
                        buttons: {
                            Ok: function () {
                                $(this).dialog("close");
                            }
                        }
                    });
                };
                btnSaveMdx = $("<button/>", {
                    "class": "jqcube-savemdx-button",
                    "text": "",
                    "click": function (event) {
                        event.preventDefault();
                        if (plugin.settings.SaveMdx.Form === undefined) {
                            $.ajax({
                                url: plugin.settings.SaveMdx.URL,
                                type: "POST",
                                data: { "mdx": getMdx() },
                                cache: false, //bcs of IE
                                complete: saveComplete,
                                dataType: "json"
                            });
                        } else {
                            var newForm = $(plugin.settings.SaveMdx.Form, {}).append($('<input>', {
                                'name': 'mdx',
                                'value': getMdx(),
                                'type': 'hidden'
                            }));
                            var modal = $('<div id="jqCubeSaveMdxDialog" title="' + $.jqCube.i18n.SaveMdx.Title + '">', {});
                            modal.append('<hr>').append(newForm).append('<hr>').append('<div style="text-align:center;"><button id="saveOK">' + $.jqCube.i18n.SaveMdx.Save + '</button><button id="saveCancel">' + $.jqCube.i18n.SaveMdx.Cancel + '</button></div>');
                            modal.find('#saveOK').click(function () {
                                $.ajax({
                                    url: plugin.settings.SaveMdx.URL,
                                    type: "POST",
                                    data: newForm.serialize(),
                                    cache: false, //bcs of IE
                                    complete: saveComplete,
                                    dataType: "json"
                                });
                                modal.dialog("close");
                            });

                            modal.find('#saveCancel').click(function () {
                                modal.dialog("close");
                            });

                            modal.dialog({
                                width: "70%",
                                modal: true
                            });

                        }

                    }
                });
                toolbarDiv.append(btnSaveMdx);
                btnSaveMdx.attr('disabled', 'disabled');
            }

            toolbarDiv.append('<div class="jqcube-spinner"/>');
            toolbarDiv.append(statusDiv);

            leftDiv.addClass("jqCubeLeft");
            rightDiv.addClass("jqCubeRight");

            tableDiv.html(rTable.getHtml(onColumns, onRows, onSort));

            filterDiv.droppable({
                accept: "[uname][etype=Member]",
                activeClass: "drag-on",
                // hoverClass: "ui-state-active",
                drop: function (event, ui) {
                    var qe = new QueryElement($(ui.draggable[0]));
                    if (qe.isMember()) {
                        addToAxis(qe, "Filter", $(this).attr("pos"));
                    } else {
                        window.alert ('unknown etype (for filter)');
                    }
                }
            });

            garbageDiv.droppable({
                accept: "[uname]",
                hoverClass: "jqcube-gcan-hover",
                drop: function (event, ui) {
                    if ($(ui.draggable[0]).attr("from") === 'Filter')
                        removeFromFilter(new QueryElement($(ui.draggable[0])));
                    else
                        removeFromQuery(new QueryElement($(ui.draggable[0])));
                }
            });
            updateFilterPane();

        };

        // fire up the plugin!
        // call the "constructor" method
        plugin.init();

    };

    // add the plugin to the jQuery.fn object
    $.fn.jqCube = function (options) {

        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function () {

            // if plugin has not already been attached to the element
            if (undefined === $(this).data('jqCube')) {

                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.jqCube(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('jqCube').publicMethod(arg1, arg2, ... argn) or
                // element.data('jqCube').settings.propertyName
                $(this).data('jqCube', plugin);

            }

        });

    };

    // Additional  helper "classes" and assets:

    $.jqCube.i18n = {
        General: {
            Message: "Message",
            Status: "Status",
            Measures: "Measures"
        },
        EmptyTable: {
            DropColumnsCaption: "--drop measures and columns here--",
            DropRowsCaption: "--drop rows here--"
        },
        Filter: {
            DropCaption: "--drop filter members here--",
            SelectMembersTitle: "Please select allowed members",
            SelectMembersAll: "All",
            SelectMembersNone: "None",
            SelectMembersOK: "OK",
            SelectMembersCancel: "Cancel"
        },
        Toolbar: {
            ReadyCaption: "Ready.",
            PopulatingCaption: "Populating dimension tree...",
            ExecutingCaption: "Executing query...",
            ErrorOccurred: "An error occurred."
        },
        SliceAndDice: {
            Title: "Slice and Dice",
            Apply: "Apply",
            Close: "Close"
        },
        Order: {
            Title: "Please select order criteria",
            OrderType: "Order type",
            None: "None",
            Apply: "Apply",
            Close: "Close"
        },
        SaveMdx: {
            Title: "Save Mdx",
            Save: "Save",
            Cancel: "Cancel"
        }
    };

    // This is fine, these are private, ie in anonymous function scope (module pattern):
    // ResultTable = function(r) ... would be bad (global).

    function ResultTable(r) {
        this.result = r;
    }

    ResultTable.prototype.setResult = function (r) {
        this.result = r;
    };
    ResultTable.prototype.csrs = function (cs, ecs, rs, ers, mcs) {
        var span = "";
        if (cs  !== undefined) span += ' colspan="'  + cs  + '" clpscs="' + cs + '"';
        if (ecs !== undefined) span += ' expndcs="'  + ecs + '"';
        if (rs  !== undefined) span += ' rowspan="'  + rs  + '" clpsrs="' + rs + '"';
        if (ers !== undefined) span += ' expndrs="'  + ers + '"';
        if (mcs !== undefined) span += ' expndmcs="' + mcs + '"';
        return span;
    };

    ResultTable.prototype.hasCells = function () {
        return this.result && this.result.cSet && this.result.cSet.length;
    };

    ResultTable.prototype.appendOrderIcon = function (uhname, onSort) {
        if (onSort && onSort.member.isMeasure() && onSort.member.uname === uhname) {
            return '<span class="jqcube-order-sort' + onSort.type + '"></span>';
        } else if (onSort && onSort.member.huname === uhname) {
            return '<span class="jqcube-order-sort' + onSort.type + '"></span>';
        }
        return '';
    };

    ResultTable.prototype.getMdxTable = function (merge, onSort) {
        var i;
        var axis0 = this.result.axisInfo[0];
        var axis1 = this.result.axisInfo[1];
        var cSet = this.result.cSet;
        var hc0 = axis0.hierarchies.length;
        var hc1 = axis1.hierarchies.length;
        var pc0 = axis0.positions.length;
        var pc1 = axis1.positions.length;
        var rowsPlaceHolder = '&nbsp;&nbsp;&nbsp;&nbsp;', measuresPlaceHolder = '&nbsp;&nbsp;&nbsp;&nbsp;';
        if (pc0 <= 0) {
            return "Nije dohvaćen niti jedan zapis na kolonama.";
        }
        if (pc1 <= 0) {
            return "Nije dohvaćen niti jedan zapis u retcima.";
        }

        var result = '<TABLE class="jqcube-rtable" >';
        result += ('\n<TR class="jqcube-drag-row-off"><TD axis="Col" pos="0"' + this.csrs(hc1, 2 * hc1 + 1) + '></TD><TD class="drag-on" axis="Col" pos="0"' + this.csrs(1 + pc0 * 2) + '>&nbsp;</TD></TR>');
        for (var h = 0; h < hc0; ++h) {
            result += ("\n<TR>");
            var c;
            if (h === hc0 - 1) {
                // Row dim labels:
                for (c = 0; c < hc1; ++c) {
                    //var foo = axis1.positions[0].members[c].uname;
                    //foo = foo.substring(1, foo.indexOf("]"));
                    result += "\n<TH class=\"drag-on, jqcube-drag-col-off\" rowspan=\"" + (pc1 + 1) + "\" axis=\"Row\" pos=\"" + c + "\">" + rowsPlaceHolder + "</TH>" + " <TH class = \"jqcube-cheader\" etype=\"Hierarchy\" uname=\"" + axis1.hierarchies[c].uname + "\" huname=\"" + axis1.hierarchies[c].uname + "\">" + axis1.hierarchies[c].caption + this.appendOrderIcon(axis1.hierarchies[c].uname, onSort) + "</TH>";  // "\n<TH class=\"jqcube-drag-col-off\">&nbsp;C#</TH> "
                }
                result += "\n<TH class=\"drag-on, jqcube-drag-col-off\" rowspan=\"" + (pc1 + 1) + "\" axis=\"Row\" pos=\"" + hc1 + "\">" + rowsPlaceHolder + "</TH>"; //"\n<TH class=\"jqcube-drag-col-off\">&nbsp;C#</TH>";
            } else if (h === 0) {
                result += ('\n<TD class="dock" ' + this.csrs(hc1, 2 * hc1 + 1, (hc0 > 1) ? hc0 - 1 : 1, 2 * (hc0 - 1)) + '>&nbsp;</TD>');
            }
            var OldHeader = axis0.positions[0].members[h].caption;
            var headerRow;
            if (h === hc0 - 1) {
                headerRow = '<TH class="drag-on, jqcube-drag-measure-off" axis="Measure" pos="0">' + measuresPlaceHolder + '</TH>' + '<TH class = "jqcube-cheader" colspan = "?" etype="Measure" huname="' + axis0.hierarchies[h].uname + '" caption="' + axis0.positions[0].members[h].caption + '" uname="' + axis0.positions[0].members[h].uname + '">' + axis0.positions[0].members[h].caption + this.appendOrderIcon(axis0.positions[0].members[h].uname, onSort);
            } else {
                headerRow = '<TH class = "jqcube-cheader" colspan = "?" etype="Member" huname="' + axis0.hierarchies[h].uname + '" caption="' + axis0.positions[0].members[h].caption + '" uname="' + axis0.positions[0].members[h].uname + '">' + axis0.positions[0].members[h].caption;
            }
            var colSpan = 1;
            for (i = 1; i < pc0; ++i) {
                if (h === hc0 - 1) headerRow += "<TH class=\"drag-on, jqcube-drag-measure-off\" axis=\"Measure\" pos=\"" + i + "\">" + measuresPlaceHolder + "</TH>";
                if (axis0.positions[i].members[h].caption != OldHeader) {
                    OldHeader = axis0.positions[i].members[h].caption;
                    headerRow += "</TH>";
                    headerRow = headerRow.replace("colspan = \"?\"", ((h === hc0 - 1) ? "colspan = \"" + colSpan + "\"" : this.csrs(colSpan, undefined, undefined, undefined, colSpan * 2)));
                    headerRow += '\n<TH class = "jqcube-cheader" colspan = "?"' + ((h < hc0 - 1) ? ' etype="Member" ' : ' etype="Measure" ') + ' huname="' + axis0.hierarchies[h].uname + '" caption="' + axis0.positions[i].members[h].caption + '" uname="' + axis0.positions[i].members[h].uname + '"' + '>' + axis0.positions[i].members[h].caption + this.appendOrderIcon(axis0.positions[i].members[h].uname, onSort);
                    colSpan = 0;
                }
                ++colSpan;
            }
            headerRow = headerRow.replace("colspan = \"?\"", ((h === hc0 - 1) ? "colspan = \"" + colSpan + "\"" : this.csrs(colSpan, undefined, undefined, undefined, colSpan * 2 + 1)));
            result += headerRow;
            result += "</TH>";
            if (h === hc0 - 1) result += "<TH class=\"drag-on, jqcube-drag-measure-off\" axis=\"Measure\" pos=\"" + pc0 + "\" >" + measuresPlaceHolder + "</TH>";
            result += "</TR>";
            if (h < hc0 - 1) {
                result += ('\n<TR class="jqcube-drag-row-off"><TD class="drag-on" colspan="' + (1 + pc0 * 2) + '" axis="Col" pos="' + (h + 1) + '">&nbsp;</TD></TR>');
            }
        }


        //var sum = [];
        //var percentageMask = 0;
        var oldH = [];
        var rowSpan = [];
        var baseLevelDepth = [];
        var className;
        var row = "";
        for (h = 0; h < hc1; ++h) {
            oldH[h] = "";
            rowSpan[h] = 0;
            baseLevelDepth[h] = axis1.positions[0].members[h].leveldepth;
        }
        var rowClassNameNo, oldRowClassNameNo, resultFieldClassNo;
        oldRowClassNameNo = 1;
        rowClassNameNo = 0;
        for (var j = 0; j < pc1; ++j) {
            row += "\n<TR >";
            for (h = 0; h < hc1 - 1; ++h) {
                // row += (j==0) ? "\n\t<TD class=\"drag-on, jqcube-drag-col-off\" rowspan=\"" + pc1 + "\" axis=\"Row\" pos=\"" + h + "\">C#1</TD>" : '';
                if ((merge === false) || (axis1.positions[j].members[h].caption != oldH[h])) {
                    oldH[h] = axis1.positions[j].members[h].caption;
                    row = row.replace("rs" + h + " = \"?\"", "rowspan = \"" + rowSpan[h] + "\"");
                    rowSpan[h] = 0;
                    if (h === 0) {
                        rowClassNameNo = 1 - rowClassNameNo;
                        for (var hh = 1; hh < hc1; ++hh) {
                            row = row.replace("rs" + hh + " = \"?\"", "rowspan = \"" + rowSpan[hh] + "\"");
                        }
                        result += (row);
                        row = "";
                        for (var r = 1; r < hc1 - 1; ++r) {
                            oldH[r] = "";
                        }
                    }
                    row += "\n\t<TD class = \"jqcube-rheader" + rowClassNameNo + "\" rs" + h + " = \"?\" etype=\"Member\" huname=\"" + axis1.hierarchies[h].uname + "\" caption=\"" + axis1.positions[j].members[h].caption + "\" uname=\"" + axis1.positions[j].members[h].uname + "\">" + this.indent(this.pos(3 * (axis1.positions[j].members[h].leveldepth - baseLevelDepth[h]))) + axis1.positions[j].members[h].caption + "</TD>";
                }
                ++rowSpan[h];
            }
            row +=  "\n\t<TD class = \"jqcube-rheader" + rowClassNameNo + "\" rowspan = \"1\" etype=\"Member\" huname=\"" + axis1.hierarchies[hc1 - 1].uname +
                    "\" caption=\"" + axis1.positions[j].members[hc1 - 1].caption +
                    "\" uname=\"" + axis1.positions[j].members[hc1 - 1].uname + "\">" +
                    this.indent(this.pos(3 * (axis1.positions[j].members[hc1 - 1].leveldepth - baseLevelDepth[hc1 - 1]))) +
                    axis1.positions[j].members[hc1 - 1].caption + "</TD>";

            if ((oldRowClassNameNo != rowClassNameNo)) {
                resultFieldClassNo = 0;
                oldRowClassNameNo = rowClassNameNo;
            } else {
                resultFieldClassNo = 1;
            }
            for (var k = 0; k < pc0; ++k) {
                if (j % 2 === 0) {
                    className = "\n\t<TD class =\"jqcube-cellwhite" + resultFieldClassNo + "\">";
                } else {
                    className = "\n\t<TD class =\"jqcube-cellyellow" + resultFieldClassNo + "\">";
                }
                row += className + this.fs(cSet[j * pc0 + k].formattedValue) + "</TD>";

            }
            row += "\n</TR >";
        }

        for (h = 0; h < hc1; ++h) {
            row = row.replace("rs" + h + " = \"?\"", "rowspan = \"" + rowSpan[h] + "\"");
        }
        result += row;
        result += "</TABLE>";

        return result;

    };

    ResultTable.prototype.getHtml = function (onColumns, onRows, onSort) { // , onFilter
        if (!this.hasCells()) { // && (!self.onRows || !self.onColumns)

            var mcCaption = '<span class="jqcube-emptytable-caption">' + $.jqCube.i18n.EmptyTable.DropColumnsCaption + '</span>',
                rCaption = '<span class="jqcube-emptytable-caption">' + $.jqCube.i18n.EmptyTable.DropColumnsCaption + '</span>';

            for (var i = 0 ; i < 2; ++i) {
                var currAxis = (i === 0) ? onColumns : onRows;
                var desc = '';
                var axisall = [];
                for (var index = 0; index < currAxis.length; ++index) {
                    desc = '';
                    var all = [];
                    for (var curri = 0; curri < currAxis[index].length; ++curri) {
                        all.push((currAxis[index])[curri].uname);
                    }
                    // $.each(currAxis[index], function (index, value) {
                    //     all.push(value.uname);
                    // });
                    axisall.push("(" + all.join(", ") + ")");
                }
                if (axisall.length)
                    if (i === 0) mcCaption = '&nbsp;<br>' + axisall.join(" * ") + '<br>&nbsp;';
                    else rCaption = '&nbsp;<br>' + axisall.join(" * ") + '<br>&nbsp;';
            }

            return '<table  class="jqcube-emptytable" >' +
                    '   <tr class="jqcube-emptytr"> ' +
                    '       <td> &nbsp;</td> ' +
                    '       <td id="mcDropZone" class="jqcube-drag-measure-off jqcube-drag-col-off jqcube-display-on " axis="Col">' + mcCaption + '</td> ' +
                    '   </tr>  ' +
                    '   <tr> ' +
                    '       <td id="rDropZone" axis="Row" class="jqcube-drag-row-off  jqcube-display-on ">' + rCaption + '</td> ' +
                    '       <td style="text-align: center;">(...)</td> ' +
                    '   </tr>   ' +
                    '</table>';
        } else
            return this.getMdxTable(true, onSort);
    };
    ResultTable.prototype.pos = function (n) { return (n > 0) ? n : 0; };
    ResultTable.prototype.indent = function (n) {
        var i, result = '';
        for (i = 0; i < n; ++i) result += '&nbsp;';
        return result;
    };
    ResultTable.prototype.fs = function (str) {
        str = str.trim();
        if (str === "") {
            return "";
        } else if (str === "1,#INF" || str === "1,#J" || str === "1#I,NF%" || str === "1,JE+00" || str === "1.#INF" || str === "1.#J" || str === "1#I.NF%" || str === "1.JE+00") {
            return "<SPAN style=\"FONT-SIZE: 14pt;\">&#8734;</SPAN>";
        } else if (str === "-1,#INF" || str === "-1,#J" || str === "-1#I,NF%" || str === "-1,JE+00" || str === "-1.#INF" || str === "-1.#J" || str === "-1#I.NF%" || str === "-1.JE+00") {
            return "<SPAN style=\"FONT-SIZE: 10pt;\">-&#8734;</SPAN>";
        } else {
            return str;
        }
    };

    function QueryElement(node) {
        this.caption = node.attr("caption");
        this.uname = node.attr("uname");
        this.huname = node.attr("huname");
        this.etype = node.attr("etype");
        this.duname = node.attr("duname");
        this.exceptMembers = [];
        this.drillMembers = [];
    }
    QueryElement.prototype.getMembersExpression = function () {
        var expr;
        if (this.etype === 'Dimension' || this.etype === 'Hierarchy' || this.etype === 'Level') expr = this.uname + '.Members';
        else if (this.etype === 'Measure') expr = this.uname;
        else return null;

        if (this.drillMembers.length) {
            expr = 'DrilldownMember(' + expr + ', {' + this.drillMembers.join(", ") + '}' + ((this.drillMembers.length > 1) ? ', RECURSIVE' : '') + ')';
        }
        if (this.exceptMembers.length) {
            var exparr = [];
            $.each(this.exceptMembers, function (i, val) {
                exparr.push(val.uname);
            });
            expr = 'Except({' + expr + '}, {' + exparr.join(", ") + '})';
        }
        return expr;
    };

    QueryElement.prototype.isSameHierarchy = function (other) {
        return (this.huname === other.huname);
    };

    QueryElement.prototype.isMeasure = function () {
        var pos = this.huname.indexOf('Measure');
        return (pos === 0 || pos === 1);
    };

    QueryElement.prototype.isHierarchy = function () {
        return (this.etype === 'Hierarchy');
    };
    QueryElement.prototype.isMember = function () {
        return (this.etype === 'Member');
    };

    QueryElement.prototype.isLevel = function () {
        return (this.etype === 'Level');
    };

    QueryElement.prototype.addExceptMember = function (qe) {
        this.exceptMembers.push(qe);
    };

    QueryElement.prototype.toggleDrillMember = function (qe) {
        for (var i = 0; i < this.drillMembers.length; ++i) {
            if (this.drillMembers[i] === qe.uname) {
                this.drillMembers.splice(i, 1);
                return;
            }
        }
        this.drillMembers.push(qe.uname);
    };

    QueryElement.prototype.toHtml = function () {
        return 'caption="' + this.caption + '" uname="' + this.uname + '" huname="' + this.huname + '" etype="' + this.etype + '"';
    };


})(jQuery);


//---------------------------
