# save as inspect_h5.py and run: python inspect_h5.py
import h5py, json, sys, pprint

fname = "DenseNet2d256.h5"

with h5py.File(fname, 'r') as f:
    print("Top-level keys:", list(f.keys()))
    # try attribute first
    raw = None
    if 'model_config' in f.attrs:
        raw = f.attrs['model_config']
        print("Found model_config in attributes.")
    elif 'model_config' in f:
        raw = f['model_config'][()]
        print("Found model_config as dataset.")
    else:
        # old keras sometimes stores under 'keras_metadata' or not at all
        if 'keras_metadata' in f.attrs:
            print("Found keras_metadata in attributes.")
        print("No model_config found in HDF5. May be weights-only.")
    if raw is None:
        sys.exit(0)

    if isinstance(raw, bytes):
        config = json.loads(raw.decode('utf-8'))
    else:
        config = json.loads(raw)

    # print model type and top keys
    print("Top-level model keys:", list(config.keys()))
    # If it's wrapped, sometimes config is under 'config' key
    if 'class_name' in config:
        print("Model class_name:", config.get('class_name'))
    if 'config' in config and isinstance(config['config'], dict) and 'layers' in config['config']:
        layers = config['config']['layers']
    elif 'layers' in config:
        layers = config['layers']
    else:
        print("Couldn't find layers list in config.")
        layers = []

    problem_layers = []
    for layer in layers:
        name = layer.get('config', {}).get('name', layer.get('name'))
        inbound = layer.get('inbound_nodes', layer.get('inbound_nodes', []))
        # count distinct inbound tensor references
        total_inputs = 0
        for node in inbound:
            # node is list of inputs for that outbound node
            if isinstance(node, list):
                for input_group in node:
                    # input_group could be list of input references
                    if isinstance(input_group, list):
                        total_inputs += len(input_group)
                    else:
                        total_inputs += 1
        if total_inputs > 1:
            problem_layers.append((name, total_inputs, inbound))
    print("\nLayers with >1 inbound inputs (possible culprits):")
    pprint.pprint(problem_layers)
    # print first few layers for context
    print("\nFirst 8 layers config (summary):")
    for i, L in enumerate(layers[:8]):
        print(i, L.get('config', {}).get('name', L.get('name')), "class:", L.get('class_name'))
