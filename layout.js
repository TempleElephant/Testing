const tagInput = (formName, name, label, allowSearch, data, others = {}) => ({
    TagPicker: {
        props: {
            allowSearch,
            required: `$data.root.fields.${ name }.required`,
            formName,
            name,
            label,
            data,
            ...others,
        },
    },
});

module.exports = (formName, path) => ([
    tagInput(formName, 'appliesToCompanies', 'Applies to Companies', false, {
        from: 'API',
        request: {
            url: '`$data.app.settings.baseAPI.value`/graph',
            withCredentials: true,
            method: 'POST',
            data: {
                model: 'com.hub365.company.models.Company',
                type: 'query',
                query: 'ReadCompanies',
                arguments: {
                    query: '$data.query',
                    page: 0,
                    size: 20,
                },
                resolve: {
                    _id: true,
                    name: true,
                },
            },
        },
        list: {
            __RESOLVE: 'ARRAY',
            __PATH: '$data.request.value.values',
            __PIPELINE: [
                {
                    function: {
                        params: 'values',
                        values: ['$data'],
                        function: `
                        var filteredCompanies = values.filter(r=>r.name !== 'Portland Design')
                        return filteredCompanies.map(r=>{
                            return {
                                key: r._id,
                                label: r.name,
                                value: r._id
                            }
                        });
                    `,
                    },
                },
                // {
                //     map: {
                //         key: '$data.each._id',
                //         label: '`$data.each.name`',
                //         value: '$data.each._id',
                //     },
                // },
            ],
        },
    }, {
        onChange: [
            {
                action: 'rerender',
                arguments: {
                    name: 'companieslist',
                    definition: {
                        props: {
                            drillDown: {
                                companieslist: '$data.value',
                            },
                        },
                    },
                },
            },
            {
                action: 'api',
                arguments: {
                    request: {
                        method: 'POST',
                        url: '`$data.app.settings.baseAPI.value`/graph',
                        withCredentials: true,
                        data: {
                            model: 'com.hub365.studios.models.Studio',
                            type: 'query',
                            query: 'StudioSearch',
                            arguments: {
                                query: '$data.query',
                                size: 50,
                                sort: ['sortOrder:asc'],
                                raw_query: {
                                    bool: {
                                        must: [
                                            {
                                                term: {
                                                    isDeleted: false,
                                                },
                                            },
                                            {
                                                match: {
                                                    isActive: true,
                                                },
                                            },
                                            {
                                                terms: {
                                                    companyId: {
                                                        __RESOLVE: 'ARRAY',
                                                        __PATH: '$data',
                                                        __PIPELINE: [{
                                                            function: {
                                                                params: 'props',
                                                                values: ['$data'],
                                                                function: ` 
                                                                    var companyIds = props.value.map(e=>e.value)
                                                                    if(companyIds.indexOf('5faf2bc4ed9da40013909b07') !== -1 && companyIds.indexOf('5faf2b97ed9da40013909b04')===-1){
                                                                        companyIds.push('5faf2b97ed9da40013909b04'); 
                                                                    }
                                                                    return companyIds;
                                                                `,
                                                            },
                                                        }],
                                                    }, // '$data.formState.appliesToCompanies.value.value',
                                                },
                                            },
                                        ],
                                    },

                                },

                            },
                            resolve: {
                                address: true,
                                company: true,
                                name: true,
                                parentOffice: true,
                                shortName: true,
                                sortOrder: true,
                                thumbnailId: true,
                                _id: true,
                            },
                        },
                    },
                    onSuccess: [
                        {
                            action: 'form',
                            arguments: {
                                type: 'updateform',
                                name: formName,
                                value: {
                                    tags: {
                                        __RESOLVE: 'ARRAY',
                                        __PATH: '$data',
                                        __PIPELINE: [
                                            {
                                                function: {
                                                    params: 'values',
                                                    values: ['$data'],
                                                    function: `
                                                    var companies = values.value.map(r=>r.label); 
                                                        var studios = [];
                                                        values.response.value.values.forEach(r=>{
                                                            if(r.name !== 'Corporate' && r.name.indexOf('Nelson')===-1){
                                                                if(companies.indexOf(r.company.name) !== -1  && (r.name.indexOf('PYR') === -1)){
                                                                    studios.push({
                                                                        key: r._id,
                                                                        value: r._id,
                                                                        label: r.name,
                                                                    })
                                                                }
                                                                if(companies.indexOf('PYR') !== -1 && (r.name.indexOf('PYR') === 0)){
                                                                    studios.push({
                                                                        key: r._id,
                                                                        value: r._id,
                                                                        label: r.name,
                                                                    })
                                                                }
                                                            }
                                                        }) 
                                                        return studios;
                                                    `,
                                                },
                                            },
                                            // {
                                            //     map: {
                                            //         key: '$data.each._id',
                                            //         label: '$data.each.name',
                                            //         value: '$data.each._id',
                                            //     },
                                            // },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ],
    }),
    {
        Block: {
            rerender: {
                name: 'companieslist',
            },
            data: {
                companies: {
                    from: 'RESOLVE',
                    value: {
                        __RESOLVE: 'ARRAY',
                        __PATH: `$data.root.${ path }.appliesToCompanies`,
                        __PIPELINE: [
                            {
                                map: {
                                    key: '$data.each._id',
                                    label: '`$data.each.name`',
                                    value: '$data.each._id',
                                },
                            },
                        ],
                        __DEFAULT: [],
                    },
                },
            },
            props: {
                drillDown: {
                    companieslist: '$data.companies',
                },
                layout: [
                    {
                        Block: {
                            data: {
                                studiosList: {
                                    from: 'API',
                                    request: {
                                        url: '`$data.app.settings.baseAPI.value`/graph',
                                        withCredentials: true,
                                        method: 'POST',
                                        data: {
                                            model: 'com.hub365.studios.models.Studio',
                                            type: 'query',
                                            query: 'StudioSearch',
                                            arguments: {
                                                query: '$data.query',
                                                size: 50,
                                                sort: ['sortOrder:asc'],
                                                raw_query:
                                                {
                                                    bool: {
                                                        must: [
                                                            {
                                                                term: {
                                                                    isDeleted: false,
                                                                },
                                                            },
                                                            {
                                                                match: {
                                                                    isActive: true,
                                                                },
                                                            },
                                                            {
                                                                terms: {
                                                                    __RESOLVE: 'OBJECT',
                                                                    __PATH: '$data',
                                                                    __PIPELINE: [{
                                                                        function: {
                                                                            params: 'props',
                                                                            values: ['$data'],
                                                                            function: `
                                                                            var obj = {}
                                                                            var companyIds = props.root.companieslist.map(e=>e.value)
                                                                            if(companyIds.indexOf('5faf2bc4ed9da40013909b07') !== -1 && companyIds.indexOf('5faf2b97ed9da40013909b04')===-1){
                                                                                companyIds.push('5faf2b97ed9da40013909b04');
                                                                            }
                                                                            obj = {companyId : companyIds};
                                                                            return obj;
                                                                        `,
                                                                        },
                                                                    }],
                                                                },
                                                            },
                                                        ],
                                                    },

                                                },

                                            },
                                            resolve: {
                                                address: true,
                                                company: true,
                                                name: true,
                                                parentOffice: true,
                                                shortName: true,
                                                sortOrder: true,
                                                thumbnailId: true,
                                                _id: true,
                                            },
                                            useNewResolve: true,
                                        },
                                    },
                                },
                                studios: {
                                    from: 'RESOLVE',
                                    value: {
                                        __RESOLVE: 'ARRAY',
                                        __PATH: '$data',
                                        __PIPELINE: [
                                            {
                                                function: {
                                                    params: 'values',
                                                    values: ['$data'],
                                                    function: `
                                                        var studios = [];
                                                        var studioslist = values.studiosList.value.values;
                                                        var companies = values.root.companieslist.map(c=>c.label);
                                                        console.log(companies)
                                                        studioslist.forEach(r=>{
                                                            if(r.name !== 'Corporate' && r.name.indexOf('Nelson')===-1){
                                                                if(companies.indexOf(r.company.name) !== -1   && (r.name.indexOf('PYR') === -1)){
                                                                    studios.push({
                                                                        key: r._id,
                                                                        value: r._id,
                                                                        label: r.name,
                                                                    })
                                                                }
                                                                if(companies.indexOf('PYR') !== -1 && (r.name.indexOf('PYR') === 0)){
                                                                    studios.push({
                                                                        key: r._id,
                                                                        value: r._id,
                                                                        label: r.name,
                                                                    })
                                                                }
                                                            }
                                                        })
                                                        console.log("STUDIOSLIST")
                                                        console.log(studios)
                                                        return studios;
                                                    `,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                            props: {
                                studios: '$data.studios',
                                layout: [
                                    tagInput(formName, 'tags', 'Applies to Studios', true, {
                                        from: 'STATIC',
                                        value: '$data.root.studios',
                                    }, {}),
                                ],
                            },
                        },
                    },
                ],
            },
        },
    },

]);
